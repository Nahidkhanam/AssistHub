import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://hub:hub@localhost:5432/assisthub',
  dbSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET ?? (isProd ? '' : 'dev-secret-change-me-dev-secret-change-me'),
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  adminEmail: (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(),
};

if (isProd && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
}
