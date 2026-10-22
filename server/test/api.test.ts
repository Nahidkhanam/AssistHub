import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createPool, migrate } from '../src/db.js';
import { seed } from '../src/seed.js';

const pool = createPool(process.env.TEST_DATABASE_URL ?? 'postgres://hub:hub@localhost:5432/assisthub_test');
const app = createApp(pool, { rateLimits: false });
const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
let user = '', admin = '', toolId = '';

beforeAll(async () => {
  await pool.query('drop table if exists favorites, reviews, messages, tools, users cascade');
  await migrate(pool);
  await seed(pool);
});
afterAll(async () => { await pool.end(); });

describe('auth', () => {
  it('registers, rejects duplicates and weak passwords', async () => {
    const a = await request(app).post('/api/auth/register').send({ name: 'Ada', email: 'ada@example.com', password: 'longenough1' });
    expect(a.status).toBe(201); expect(a.body.user.role).toBe('user'); expect(a.body.user.password_hash).toBeUndefined();
    user = a.body.token;
    expect((await request(app).post('/api/auth/register').send({ name: 'Ada', email: 'ADA@example.com', password: 'longenough1' })).status).toBe(409);
    const weak = await request(app).post('/api/auth/register').send({ name: 'Bo', email: 'bo@example.com', password: 'short' });
    expect(weak.status).toBe(400); expect(weak.body.fields.password).toBeTruthy();
  });
  it('makes the ADMIN_EMAIL account an admin', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'Admin', email: 'admin@example.com', password: 'adminpass123' });
    expect(r.body.user.role).toBe('admin'); admin = r.body.token;
  });
  it('logs in and rejects wrong passwords with a generic message', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'longenough1' })).status).toBe(200);
    const bad = await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'nope-nope' });
    expect(bad.status).toBe(401);
    const none = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope-nope' });
    expect(none.body.error).toBe(bad.body.error);
  });
  it('protects /me', async () => {
    expect((await request(app).get('/api/me')).status).toBe(401);
    expect((await request(app).get('/api/me').set(bearer('garbage'))).status).toBe(401);
    expect((await request(app).get('/api/me').set(bearer(user))).body.user.email).toBe('ada@example.com');
  });
});

describe('tools', () => {
  it('lists, searches, filters and paginates published tools', async () => {
    const all = await request(app).get('/api/tools?limit=3');
    expect(all.body.total).toBe(7); expect(all.body.items).toHaveLength(3); expect(all.body.pages).toBe(3);
    toolId = all.body.items[0].id;
    expect((await request(app).get('/api/tools?q=nvda')).body.items.map((t: { name: string }) => t.name)).toEqual(['NVDA']);
    expect((await request(app).get('/api/tools?platform=Android')).body.items.map((t: { name: string }) => t.name).sort()).toEqual(['Be My Eyes', 'TalkBack']);
    expect((await request(app).get('/api/tools?need=Get%20live%20help')).body.total).toBe(1);
    expect((await request(app).get('/api/tools?q=%25')).body.total).toBe(0); // wildcard characters are literal
    expect((await request(app).get('/api/tools?platform=Plan9')).status).toBe(400);
  });
  it('returns a detail page and 404 for unknown slugs', async () => {
    expect((await request(app).get('/api/tools/nvda')).body.tool.name).toBe('NVDA');
    expect((await request(app).get('/api/tools/nope')).status).toBe(404);
  });
  it('handles SQL-injection-looking input safely', async () => {
    const r = await request(app).get("/api/tools?q=' OR 1=1; drop table tools;--");
    expect(r.status).toBe(200); expect(r.body.total).toBe(0);
    expect((await request(app).get('/api/tools')).body.total).toBe(7);
  });
});

describe('favorites', () => {
  it('requires sign in, then adds and removes', async () => {
    expect((await request(app).put(`/api/tools/${toolId}/favorite`)).status).toBe(401);
    expect((await request(app).put(`/api/tools/${toolId}/favorite`).set(bearer(user))).body.favorited).toBe(true);
    await request(app).put(`/api/tools/${toolId}/favorite`).set(bearer(user)); // idempotent
    expect((await request(app).get('/api/me/favorites').set(bearer(user))).body.items).toHaveLength(1);
    expect((await request(app).get('/api/tools').set(bearer(user))).body.items.find((t: { id: string }) => t.id === toolId).favorited).toBe(true);
    await request(app).delete(`/api/tools/${toolId}/favorite`).set(bearer(user));
    expect((await request(app).get('/api/me/favorites').set(bearer(user))).body.items).toHaveLength(0);
    expect((await request(app).put('/api/tools/not-a-uuid/favorite').set(bearer(user))).status).toBe(404);
  });
});

describe('reviews and moderation', () => {
  it('holds reviews until an admin approves them', async () => {
    const body = { rating: 5, body: 'Easy to start with and works well.' };
    expect((await request(app).post(`/api/tools/${toolId}/reviews`).set(bearer(user)).send({ rating: 9, body: 'x' }))).toHaveProperty('status', 400);
    expect((await request(app).post(`/api/tools/${toolId}/reviews`).set(bearer(user)).send(body)).status).toBe(201);
    const slug = (await request(app).get('/api/tools?limit=1')).body.items[0].slug;
    expect((await request(app).get(`/api/tools/${slug}`)).body.reviews).toHaveLength(0);
    expect((await request(app).get(`/api/tools/${slug}`).set(bearer(user))).body.myReview.status).toBe('pending');

    expect((await request(app).get('/api/admin/reviews').set(bearer(user))).status).toBe(403);
    const pending = await request(app).get('/api/admin/reviews').set(bearer(admin));
    expect(pending.body.items).toHaveLength(1);
    await request(app).patch(`/api/admin/reviews/${pending.body.items[0].id}`).set(bearer(admin)).send({ status: 'approved' }).expect(200);
    const detail = await request(app).get(`/api/tools/${slug}`);
    expect(detail.body.reviews).toHaveLength(1); expect(detail.body.tool.ratingAvg).toBe(5); expect(detail.body.tool.ratingCount).toBe(1);
  });
});

describe('suggestions and admin CRUD', () => {
  const tool = { name: 'Demo Reader', maker: 'Demo Co', kind: 'Screen reader', platforms: ['Windows'], needs: ['Read the screen aloud'], cost: 'Free', summary: 'A demo tool used only in tests for the suggestion flow.', url: 'https://example.com/demo' };
  let id = '';
  it('queues suggestions as pending and validates input', async () => {
    expect((await request(app).post('/api/tools/suggest').send(tool)).status).toBe(401);
    expect((await request(app).post('/api/tools/suggest').set(bearer(user)).send({ ...tool, url: 'http://example.com' })).status).toBe(400);
    expect((await request(app).post('/api/tools/suggest').set(bearer(user)).send({ ...tool, url: 'javascript:alert(1)' })).status).toBe(400);
    expect((await request(app).post('/api/tools/suggest').set(bearer(user)).send(tool)).status).toBe(201);
    expect((await request(app).get('/api/tools')).body.total).toBe(7);
    expect((await request(app).get('/api/me/suggestions').set(bearer(user))).body.items[0].status).toBe('pending');
  });
  it('lets an admin approve, edit and delete', async () => {
    const pend = await request(app).get('/api/admin/tools?status=pending').set(bearer(admin));
    expect(pend.body.items).toHaveLength(1); id = pend.body.items[0].id;
    await request(app).patch(`/api/admin/tools/${id}`).set(bearer(admin)).send({ status: 'published', cost: 'Free forever' }).expect(200);
    expect((await request(app).get('/api/tools')).body.total).toBe(8);
    expect((await request(app).get('/api/tools/demo-reader')).body.tool.cost).toBe('Free forever');
    expect((await request(app).patch(`/api/admin/tools/${id}`).set(bearer(user)).send({ cost: 'x' })).status).toBe(403);
    expect((await request(app).post('/api/admin/tools').set(bearer(admin)).send({ ...tool, name: 'Another' })).status).toBe(201);
    expect((await request(app).delete(`/api/admin/tools/${id}`).set(bearer(admin))).status).toBe(204);
    expect((await request(app).delete(`/api/admin/tools/${id}`).set(bearer(admin))).status).toBe(404);
    const stats = await request(app).get('/api/admin/stats').set(bearer(admin));
    expect(stats.body.tools).toBe(8);
  });
});

describe('contact, prefs and checker', () => {
  it('stores messages, ignores honeypot bots, and lets admins read them', async () => {
    expect((await request(app).post('/api/contact').send({ name: 'A', email: 'bad', message: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/contact').send({ name: 'A', email: 'a@example.com', message: 'Hello, this is a real message.' })).status).toBe(201);
    expect((await request(app).post('/api/contact').send({ name: 'Bot', email: 'b@example.com', message: 'Buy cheap stuff now please', website: 'spam.example' })).status).toBe(201);
    const msgs = await request(app).get('/api/admin/messages').set(bearer(admin));
    expect(msgs.body.items).toHaveLength(1);
    expect((await request(app).get('/api/admin/messages').set(bearer(user))).status).toBe(403);
  });
  it('saves accessibility preferences', async () => {
    await request(app).patch('/api/me/prefs').set(bearer(user)).send({ textSize: 2, contrast: true }).expect(200);
    expect((await request(app).get('/api/me').set(bearer(user))).body.user.prefs).toEqual({ textSize: 2, contrast: true });
    expect((await request(app).patch('/api/me/prefs').set(bearer(user)).send({ textSize: 9, contrast: true })).status).toBe(400);
  });
  it('refuses to check private or invalid addresses', async () => {
    for (const url of ['http://localhost', 'http://127.0.0.1', 'http://169.254.169.254/latest', 'file:///etc/passwd', 'http://10.0.0.1']) {
      const r = await request(app).post('/api/checker').send({ url });
      expect(r.status).toBe(400);
    }
  });
  it('returns JSON for unknown routes and bad JSON', async () => {
    expect((await request(app).get('/api/nothing')).status).toBe(404);
    expect((await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{bad')).status).toBe(400);
  });
});
