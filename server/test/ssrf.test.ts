import { describe, expect, it } from 'vitest';
import { assertPublicUrl, fetchPublicHtml, isBlockedIp } from '../src/lib/ssrf.js';

describe('isBlockedIp', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '::ffff:7f00:1'])(
    'blocks %s', (ip) => expect(isBlockedIp(ip)).toBe(true));
  it.each(['8.8.8.8', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111'])('allows %s', (ip) => expect(isBlockedIp(ip)).toBe(false));
});

describe('assertPublicUrl', () => {
  it.each([
    'ftp://example.com', 'file:///etc/passwd', 'http://localhost/', 'http://127.0.0.1/', 'http://2130706433/', 'http://0x7f.1/',
    'http://[::1]/', 'http://169.254.169.254/latest/meta-data', 'http://user:pw@example.com/', 'http://example.com:8080/', 'http://foo.internal/', 'not a url',
  ])('rejects %s', (u) => expect(() => assertPublicUrl(u)).toThrow());
  it('accepts a normal public address', () => expect(assertPublicUrl('https://example.com/page').hostname).toBe('example.com'));
  it('refuses to fetch private targets', async () => {
    await expect(fetchPublicHtml('http://127.0.0.1:80/')).rejects.toThrow();
    await expect(fetchPublicHtml('http://localhost/')).rejects.toThrow();
  });
});
