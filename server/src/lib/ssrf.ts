import dns from 'node:dns';
import net from 'node:net';
import { Agent, fetch } from 'undici';
import { HttpError } from './errors.js';

const blocked = new net.BlockList();
for (const [ip, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as [string, number][]) blocked.addSubnet(ip, bits, 'ipv4');
for (const [ip, bits] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['2001:db8::', 32]] as [string, number][]) blocked.addSubnet(ip, bits, 'ipv6');

/** True if the address is not a normal public internet address. */
export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blocked.check(ip, 'ipv4');
  if (family === 6) {
    const lower = ip.toLowerCase();
    // IPv4-mapped, NAT64 and 6to4 forms can hide a private IPv4 address, so block them outright.
    if (lower.startsWith('::ffff:') || lower.startsWith('64:ff9b:') || lower.startsWith('2002:')) return true;
    return blocked.check(ip, 'ipv6');
  }
  return true;
}

/** Checks the URL syntax, protocol, port and any literal IP. Throws HttpError(400) if not allowed. */
export function assertPublicUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new HttpError(400, 'Enter a full web address, for example https://example.com'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new HttpError(400, 'Only http and https addresses can be checked.');
  if (u.username || u.password) throw new HttpError(400, 'Addresses with a username or password are not allowed.');
  if (u.port && u.port !== '80' && u.port !== '443') throw new HttpError(400, 'Only the standard web ports 80 and 443 are allowed.');
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new HttpError(400, 'That address is not a public website.');
  }
  if (net.isIP(host) && isBlockedIp(host)) throw new HttpError(400, 'That address is not a public website.');
  return u;
}

// Validate the IP at connection time too, which defeats DNS-rebinding tricks.
/* eslint-disable @typescript-eslint/no-explicit-any */
function safeLookup(hostname: string, options: any, cb: any) {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs: any) => {
    if (err) return cb(err);
    if (!addrs?.length || addrs.some((a: { address: string }) => isBlockedIp(a.address))) return cb(new Error('Blocked address'));
    if (options?.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

const agent = new Agent({ connect: { lookup: safeLookup as any, timeout: 5000 }, headersTimeout: 8000, bodyTimeout: 8000 });

export const MAX_BYTES = 1_000_000;

/** Fetches a public web page safely: limited redirects, size and time, and public addresses only. */
export async function fetchPublicHtml(raw: string): Promise<{ finalUrl: string; html: string }> {
  let url = assertPublicUrl(raw);
  for (let hop = 0; hop <= 3; hop++) {
    let res;
    try {
      res = await fetch(url, {
        dispatcher: agent, redirect: 'manual', signal: AbortSignal.timeout(10_000),
        headers: { 'user-agent': 'AssistHubChecker/1.0 (accessibility quick check)', accept: 'text/html,application/xhtml+xml' },
      });
    } catch {
      throw new HttpError(422, 'We could not reach that website. Check the address and try again.');
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      await res.body?.cancel();
      url = assertPublicUrl(new URL(res.headers.get('location')!, url).toString());
      continue;
    }
    if (!res.ok) { await res.body?.cancel(); throw new HttpError(422, `The website answered with status ${res.status}.`); }
    const type = res.headers.get('content-type') ?? '';
    if (!/text\/html|application\/xhtml/i.test(type)) { await res.body?.cancel(); throw new HttpError(422, 'That address is not a web page (HTML).'); }
    const chunks: Uint8Array[] = []; let size = 0;
    const reader = res.body!.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); break; }
      chunks.push(value);
    }
    return { finalUrl: url.toString(), html: Buffer.concat(chunks).toString('utf8') };
  }
  throw new HttpError(422, 'Too many redirects.');
}
