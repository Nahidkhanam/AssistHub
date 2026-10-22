import pg from 'pg';
import { schemaSql } from './schema.js';

export type Pool = pg.Pool;

export function createPool(url: string, ssl = false): Pool {
  return new pg.Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : undefined, max: 10 });
}

export async function migrate(pool: Pool): Promise<void> {
  await pool.query(schemaSql);
}
