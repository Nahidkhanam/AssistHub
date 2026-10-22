import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config.js';
import type { Pool } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { toUser } from '../lib/mappers.js';
import { signToken } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter an email like name@example.com.').max(200),
  password: z.string().min(8, 'Use at least 8 characters.').max(100),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(100) });

export function authRoutes(pool: Pool) {
  const r = Router();

  r.post('/register', async (req, res) => {
    const d = registerSchema.parse(req.body);
    const role = config.adminEmail && d.email === config.adminEmail ? 'admin' : 'user';
    const hash = await bcrypt.hash(d.password, 10);
    try {
      const { rows } = await pool.query(
        'insert into users (email, name, password_hash, role) values ($1,$2,$3,$4) returning id, email, name, role, prefs', [d.email, d.name, hash, role]);
      res.status(201).json({ token: signToken(rows[0].id), user: toUser(rows[0]) });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new HttpError(409, 'An account with that email already exists. Try signing in.');
      throw e;
    }
  });

  r.post('/login', async (req, res) => {
    const d = loginSchema.parse(req.body);
    const { rows } = await pool.query('select id, email, name, role, prefs, password_hash from users where email = $1', [d.email]);
    const ok = rows[0] ? await bcrypt.compare(d.password, rows[0].password_hash) : await bcrypt.compare(d.password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi');
    if (!rows[0] || !ok) throw new HttpError(401, 'Email or password is incorrect.');
    res.json({ token: signToken(rows[0].id), user: toUser(rows[0]) });
  });

  return r;
}
