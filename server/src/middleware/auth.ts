import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { Pool } from '../db.js';
import { HttpError } from '../lib/errors.js';

export type AuthUser = { id: string; email: string; name: string; role: 'user' | 'admin'; prefs: Record<string, unknown> };
declare module 'express-serve-static-core' { interface Request { user?: AuthUser } }

export const signToken = (userId: string) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });

export function authMiddleware(pool: Pool) {
  const load = async (req: Request, required: boolean) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) { if (required) throw new HttpError(401, 'Please sign in.'); return; }
    let sub: string;
    try { sub = (jwt.verify(header.slice(7), config.jwtSecret) as { sub: string }).sub; }
    catch { if (required) throw new HttpError(401, 'Your session has expired. Please sign in again.'); return; }
    const { rows } = await pool.query('select id, email, name, role, prefs from users where id = $1', [sub]);
    if (!rows[0]) { if (required) throw new HttpError(401, 'Please sign in.'); return; }
    req.user = rows[0];
  };
  return {
    optional: async (req: Request, _res: Response, next: NextFunction) => { try { await load(req, false); next(); } catch (e) { next(e); } },
    required: async (req: Request, _res: Response, next: NextFunction) => { try { await load(req, true); next(); } catch (e) { next(e); } },
    admin: async (req: Request, _res: Response, next: NextFunction) => {
      try { await load(req, true); if (req.user?.role !== 'admin') throw new HttpError(403, 'Admins only.'); next(); } catch (e) { next(e); }
    },
  };
}
