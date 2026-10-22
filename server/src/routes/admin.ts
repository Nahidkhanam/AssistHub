import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { toTool } from '../lib/mappers.js';
import { authMiddleware } from '../middleware/auth.js';
import { toolInput, uniqueSlug } from './tools.js';

const statusSchema = z.enum(['published', 'pending', 'rejected']);
const uuid = (v: string) => { if (!/^[0-9a-f-]{36}$/i.test(v)) throw new HttpError(404, 'Not found'); return v; };

export function adminRoutes(pool: Pool) {
  const r = Router();
  r.use(authMiddleware(pool).admin);

  r.get('/stats', async (_req, res) => {
    const { rows } = await pool.query(`select
      (select count(*)::int from users) as users,
      (select count(*)::int from tools where status='published') as tools,
      (select count(*)::int from tools where status='pending') as pending_tools,
      (select count(*)::int from reviews where status='pending') as pending_reviews,
      (select count(*)::int from messages) as messages`);
    res.json(rows[0]);
  });

  r.get('/tools', async (req, res) => {
    const status = req.query.status ? statusSchema.parse(req.query.status) : null;
    const { rows } = await pool.query(
      `select t.*, u.name as submitter from tools t left join users u on u.id = t.submitted_by
       where ($1::text is null or t.status = $1) order by t.created_at desc limit 200`, [status]);
    res.json({ items: rows.map((x) => ({ ...toTool(x), submitter: x.submitter })) });
  });

  r.post('/tools', async (req, res) => {
    const d = toolInput.parse(req.body);
    const slug = await uniqueSlug(pool, d.name);
    const { rows } = await pool.query(
      `insert into tools (slug, name, maker, kind, platforms, needs, cost, summary, url, status, submitted_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$10) returning *`,
      [slug, d.name, d.maker, d.kind, d.platforms, d.needs, d.cost, d.summary, d.url, req.user!.id]);
    res.status(201).json({ tool: toTool(rows[0]) });
  });

  r.patch('/tools/:id', async (req, res) => {
    const id = uuid(String(req.params.id));
    const d = toolInput.partial().extend({ status: statusSchema.optional() }).parse(req.body);
    const cols = Object.keys(d) as (keyof typeof d)[];
    if (!cols.length) throw new HttpError(400, 'Nothing to update.');
    const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
    const { rows } = await pool.query(`update tools set ${sets}, updated_at = now() where id = $1 returning *`, [id, ...cols.map((c) => d[c])]);
    if (!rows[0]) throw new HttpError(404, 'That tool was not found.');
    res.json({ tool: toTool(rows[0]) });
  });

  r.delete('/tools/:id', async (req, res) => {
    const { rowCount } = await pool.query('delete from tools where id = $1', [uuid(String(req.params.id))]);
    if (!rowCount) throw new HttpError(404, 'That tool was not found.');
    res.status(204).end();
  });

  r.get('/reviews', async (req, res) => {
    const status = z.enum(['pending', 'approved', 'rejected']).default('pending').parse(req.query.status ?? 'pending');
    const { rows } = await pool.query(
      `select r.id, r.rating, r.body, r.status, r.created_at, t.name as tool, u.name as author
       from reviews r join tools t on t.id = r.tool_id join users u on u.id = r.user_id
       where r.status = $1 order by r.created_at desc limit 200`, [status]);
    res.json({ items: rows.map((x) => ({ id: x.id, rating: x.rating, body: x.body, status: x.status, tool: x.tool, author: x.author, createdAt: x.created_at })) });
  });

  r.patch('/reviews/:id', async (req, res) => {
    const { status } = z.object({ status: z.enum(['approved', 'rejected']) }).parse(req.body);
    const { rowCount } = await pool.query('update reviews set status = $1 where id = $2', [status, uuid(String(req.params.id))]);
    if (!rowCount) throw new HttpError(404, 'That review was not found.');
    res.json({ status });
  });

  r.get('/messages', async (_req, res) => {
    const { rows } = await pool.query('select id, name, email, message, created_at from messages order by created_at desc limit 200');
    res.json({ items: rows.map((x) => ({ id: x.id, name: x.name, email: x.email, message: x.message, createdAt: x.created_at })) });
  });

  return r;
}
