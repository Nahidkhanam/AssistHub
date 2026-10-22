import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from '../db.js';
import { toTool, toUser } from '../lib/mappers.js';
import { authMiddleware } from '../middleware/auth.js';

const prefsSchema = z.object({
  textSize: z.number().int().min(0).max(3),
  contrast: z.boolean(),
}).strict();

export function meRoutes(pool: Pool) {
  const r = Router();
  const auth = authMiddleware(pool);
  r.use(auth.required);

  r.get('/', (req, res) => res.json({ user: toUser(req.user) }));

  r.patch('/prefs', async (req, res) => {
    const prefs = prefsSchema.parse(req.body);
    await pool.query('update users set prefs = $1 where id = $2', [JSON.stringify(prefs), req.user!.id]);
    res.json({ prefs });
  });

  r.get('/favorites', async (req, res) => {
    const { rows } = await pool.query(
      `select t.*, rv.rating_avg, rv.rating_count, true as favorited
       from favorites f join tools t on t.id = f.tool_id and t.status = 'published'
       left join (select tool_id, avg(rating)::float as rating_avg, count(*)::int as rating_count from reviews where status='approved' group by tool_id) rv on rv.tool_id = t.id
       where f.user_id = $1 order by f.created_at desc`, [req.user!.id]);
    res.json({ items: rows.map(toTool) });
  });

  r.get('/suggestions', async (req, res) => {
    const { rows } = await pool.query('select id, name, status, created_at from tools where submitted_by = $1 order by created_at desc', [req.user!.id]);
    res.json({ items: rows.map((x) => ({ id: x.id, name: x.name, status: x.status, createdAt: x.created_at })) });
  });
  return r;
}
