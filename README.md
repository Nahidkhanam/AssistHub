# AssistHub

A full-stack, accessibility-first web app that helps blind and low-vision people find free and built-in assistive tools,
and helps website owners find common accessibility barriers.

**Live demo:** [https://assist-hub-five.vercel.app](https://assist-hub-five.vercel.app)

**Stack:** React 18, TypeScript, Tailwind CSS v4, React Router · Node.js, Express 5, TypeScript, PostgreSQL (`pg`), Zod, JWT, bcrypt · Vitest, Supertest, Testing Library, jest-axe

## Features
**For visitors**
- Searchable, filterable, paginated tool directory (device and need filters)
- Tool pages with ratings and moderated community reviews
- Accounts: save tools to *My toolkit*, write reviews, suggest tools, display settings synced across devices
- **Page accessibility checker**: enter a public URL; the server fetches it and runs 11 checks (language, title, alt text, form labels, button and link names, headings, landmarks, zoom blocking, duplicate ids) with a score, WCAG references and plain-language fixes
- Learn page: speech-speed demo, filterable NVDA shortcut table, five quick accessibility checks
- Sticky header, A− / A+ text size, high-contrast theme, **Read this page aloud** (Web Speech API)

**For admins** (the account that registers with `ADMIN_EMAIL`)
- Dashboard with stats, tool CRUD, approve or reject suggestions, moderate reviews, read contact messages

## Accessibility
Skip link, landmarks, one h1 per page, focus moved to the page heading on route change, live-region announcements for loading, results and errors, ARIA accordions, labelled forms with focused error summaries, 44 px targets, visible focus, reduced-motion support, `jsx-a11y` lint rules, and automated **axe** tests on every page.

## Architecture
```
client (React SPA, Vercel)  --HTTPS/JSON-->  server (Express API, Render)  --SQL-->  PostgreSQL (Supabase or any)
```
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public, rate limited |
| GET | `/api/tools`, `/api/tools/:slug` | public |
| POST | `/api/tools/suggest`, `/api/tools/:id/reviews` | signed in (held for moderation) |
| PUT, DELETE | `/api/tools/:id/favorite` | signed in |
| GET, PATCH | `/api/me`, `/api/me/prefs`, `/api/me/favorites`, `/api/me/suggestions` | signed in |
| POST | `/api/contact`, `/api/checker` | public, rate limited |
| any | `/api/admin/*` (stats, tools CRUD, reviews, messages) | admin only |

### Security notes
- Passwords hashed with bcrypt. JWT (7 days) verified on every request and the user is re-loaded from the database, so deleted users and role changes take effect immediately.
- All SQL is parameterized, all input validated with Zod, JSON body limited to 20 kB, helmet headers, CORS limited to `CLIENT_ORIGIN`, rate limits on auth, contact and checker.
- **SSRF protection in the checker:** only http/https on ports 80/443, no credentials, literal and resolved IPs checked against private, loopback, link-local and metadata ranges (IPv4 and IPv6 including mapped forms), IP re-validated at connection time (blocks DNS rebinding), redirects followed manually (max 3) and re-validated, 10 s timeout, 1 MB cap, HTML only.
- Honeypot field instead of CAPTCHA (image CAPTCHAs block blind users).
- Tables have Row Level Security enabled with no policies, so if the database is on Supabase the public API keys cannot read anything; only this server can.
- Known trade-off: the token is kept in `localStorage`. An httpOnly cookie would be stronger but needs same-site hosting or extra CSRF handling.

## Run locally
Requires Node 20+ and PostgreSQL 14+.
```bash
createdb assisthub && createdb assisthub_test       # or any Postgres: set DATABASE_URL

cd server && cp .env.example .env && npm install
npm run dev                  # API on :4000 (creates tables and seeds 7 tools automatically)
npm test                     # 50 tests (needs the assisthub_test database)

cd ../client && cp .env.example .env && npm install --legacy-peer-deps
npm run dev                  # http://localhost:5173
npm test                     # axe + behaviour tests
```
Register with the email you put in `ADMIN_EMAIL` to get the admin role.

## Deploy (free tiers)
1. **Database:** create a Supabase project, open *Connect*, copy the **Session pooler** connection string (add your password). Use it as `DATABASE_URL`.
2. **API on Render:** New, Blueprint, select this repo (uses `render.yaml`). Set `DATABASE_URL`, `ADMIN_EMAIL` and `CLIENT_ORIGIN` (your Vercel URL, no trailing slash). `JWT_SECRET` is generated. The free plan sleeps when idle, so the first request can take about 30 seconds.
3. **Client on Vercel:** import the repo, set *Root Directory* to `client`, add `VITE_API_URL` = your Render URL, then redeploy.
4. Open the site, register with `ADMIN_EMAIL`, and use **Admin** to manage tools.

## Content and licensing
All text and the illustration are original. Tool names identify the tools only. There are no logos or third-party images, and every tool links to its official site. AssistHub is not affiliated with or endorsed by any listed tool. Tool details can change, so check each entry before relying on it. Code is MIT licensed.

## Next steps
httpOnly cookie sessions, email verification and password reset, notification emails, Playwright end-to-end tests, Hindi and English UI.
