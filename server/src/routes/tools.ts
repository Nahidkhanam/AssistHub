import { Router } from 'express';
import { z } from 'zod';
import { NEEDS, PLATFORMS } from '../constants.js';
import type { Pool } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { toTool } from '../lib/mappers.js';
import { slugify } from '../lib/slug.js';
import { authMiddleware } from '../middleware/auth.js';

export const toolInput = z.object({
  name: z.string().trim().min(2, 'Enter the tool name.').max(80),
  maker: z.string().trim().min(2, 'Enter who makes it.').max(80),
  kind: z.string().trim().min(2, 'Enter the type, for example Screen reader.').max(40),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'Choose at least one device.').max(5),
  needs: z.array(z.enum(NEEDS)).min(1, 'Choose at least one need.').max(3),
  cost: z.string().trim().min(2, 'Describe the cost, for example Free app.').max(80),
  summary: z.string().trim().min(20, 'Write at least 20 characters.').max(500),
  url: z.string().trim().url('Enter a full web address.').max(300).refine((u) => /^https:\/\//i.test(u), 'The address must start with https://'),
});

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  platform: z.enum(PLATFORMS).optional(),
  need: z.enum(NEEDS).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});
const reviewInput = z.object({
  rating: z.coerce.number().int().min(1, 'Choose a rating from 1 to 5.').max(5),
  body: z.string().trim().min(10, 'Write at least 10 characters.').max(1000, 'Keep it under 1000 characters.'),
});

const RATING_JOIN = `left join (select tool_id, avg(rating)::float as rating_avg, count(*)::int as rating_count
  from reviews where status = 'approved' group by tool_id) rv on rv.tool_id = t.id`;

export async function uniqueSlug(pool: Pool, name: string): Promise<string> {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const { rowCount } = await pool.query('select 1 from tools where slug = $1', [slug]);
    if (!rowCount) return slug;
  }
  return `${base}-${Date.now()}`;
}

export function toolRoutes(pool: Pool) {
  const r = Router();
  const auth = authMiddleware(pool);

  r.get('/', auth.optional, async (req, res) => {
    const q = listQuery.parse(req.query);
    const { rows } = await pool.query(
      `select t.*, rv.rating_avg, rv.rating_count,
         exists(select 1 from favorites f where f.tool_id = t.id and f.user_id = $6::uuid) as favorited,
         count(*) over()::int as total
       from tools t ${RATING_JOIN}
       where t.status = 'published'
         and ($1::text is null or strpos(lower(t.name || ' ' || t.maker || ' ' || t.summary), lower($1)) > 0)
         and ($2::text is null or $2 = any(t.platforms))
         and ($3::text is null or $3 = any(t.needs))
       order by t.name limit $4 offset $5`,
      [q.q || null, q.platform ?? null, q.need ?? null, q.limit, (q.page - 1) * q.limit, req.user?.id ?? null]);
    const total = rows[0]?.total ?? 0;
    res.json({ items: rows.map(toTool), total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
  });

  // Anyone signed in can suggest a tool. It stays pending until an admin approves it.
  r.post('/suggest', auth.required, async (req, res) => {
    const d = toolInput.parse(req.body);
    const slug = await uniqueSlug(pool, d.name);
    await pool.query(
      `insert into tools (slug, name, maker, kind, platforms, needs, cost, summary, url, status, submitted_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10)`,
      [slug, d.name, d.maker, d.kind, d.platforms, d.needs, d.cost, d.summary, d.url, req.user!.id]);
    res.status(201).json({ status: 'pending', message: 'Thank you. An admin will review your suggestion.' });
  });

  r.get('/:slug', auth.optional, async (req, res) => {
    const { rows } = await pool.query(
      `select t.*, rv.rating_avg, rv.rating_count,
         exists(select 1 from favorites f where f.tool_id = t.id and f.user_id = $2::uuid) as favorited
       from tools t ${RATING_JOIN} where t.slug = $1 and t.status = 'published'`, [req.params.slug, req.user?.id ?? null]);
    if (!rows[0]) throw new HttpError(404, 'That tool was not found.');
    const reviews = await pool.query(
      `select r.id, r.rating, r.body, r.created_at, u.name as author from reviews r join users u on u.id = r.user_id
       where r.tool_id = $1 and r.status = 'approved' order by r.created_at desc limit 50`, [rows[0].id]);
    let myReview = null;
    if (req.user) {
      const mine = await pool.query('select rating, body, status from reviews where tool_id = $1 and user_id = $2', [rows[0].id, req.user.id]);
      myReview = mine.rows[0] ?? null;
    }
    res.json({ tool: toTool(rows[0]), reviews: reviews.rows.map((x) => ({ id: x.id, rating: x.rating, body: x.body, author: x.author, createdAt: x.created_at })), myReview });
  });

  const publishedId = async (id: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'That tool was not found.');
    const { rows } = await pool.query("select id from tools where id = $1 and status = 'published'", [id]);
    if (!rows[0]) throw new HttpError(404, 'That tool was not found.');
    return rows[0].id as string;
  };

  r.put('/:id/favorite', auth.required, async (req, res) => {
    const id = await publishedId(String(req.params.id));
    await pool.query('insert into favorites (user_id, tool_id) values ($1,$2) on conflict do nothing', [req.user!.id, id]);
    res.json({ favorited: true });
  });
  r.delete('/:id/favorite', auth.required, async (req, res) => {
    const id = await publishedId(String(req.params.id));
    await pool.query('delete from favorites where user_id = $1 and tool_id = $2', [req.user!.id, id]);
    res.json({ favorited: false });
  });

  // One review per user per tool. New or edited reviews wait for moderation.
  r.post('/:id/reviews', auth.required, async (req, res) => {
    const id = await publishedId(String(req.params.id));
    const d = reviewInput.parse(req.body);
    await pool.query(
      `insert into reviews (tool_id, user_id, rating, body, status) values ($1,$2,$3,$4,'pending')
       on conflict (tool_id, user_id) do update set rating = excluded.rating, body = excluded.body, status = 'pending', created_at = now()`,
      [id, req.user!.id, d.rating, d.body]);
    res.status(201).json({ status: 'pending', message: 'Thank you. Your review will appear after it is checked.' });
  });

  return r;
}
