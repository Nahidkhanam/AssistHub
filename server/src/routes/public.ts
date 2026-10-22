import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { Pool } from '../db.js';
import { analyzeHtml } from '../lib/checker.js';
import { HttpError } from '../lib/errors.js';
import { fetchPublicHtml } from '../lib/ssrf.js';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80),
  email: z.string().trim().email('Enter an email like name@example.com.').max(200),
  message: z.string().trim().min(10, 'Write at least 10 characters.').max(2000),
  website: z.string().optional(), // honeypot
});

export function publicRoutes(pool: Pool, limits: boolean) {
  const r = Router();
  const limit = (windowMs: number, max: number) =>
    limits ? rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please wait a while and try again.' } })
           : (_q: unknown, _s: unknown, next: () => void) => next();

  r.get('/health', (_req, res) => res.json({ ok: true }));

  r.post('/contact', limit(60 * 60 * 1000, 8), async (req, res) => {
    const d = contactSchema.parse(req.body);
    if (d.website) return res.status(201).json({ ok: true }); // bots fill the hidden field; pretend success
    await pool.query('insert into messages (name, email, message) values ($1,$2,$3)', [d.name, d.email, d.message]);
    res.status(201).json({ ok: true });
  });

  r.post('/checker', limit(60 * 60 * 1000, 20), async (req, res) => {
    const { url } = z.object({ url: z.string().trim().min(4, 'Enter a web address.').max(500) }).parse(req.body);
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url)) throw new HttpError(400, 'Only http and https addresses can be checked.');
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const { finalUrl, html } = await fetchPublicHtml(withScheme);
    res.json({ url: finalUrl, ...analyzeHtml(html), note: 'Quick automated checks of the HTML the site returns. This is not a full WCAG audit, and pages built with JavaScript may show fewer results.' });
  });

  return r;
}
