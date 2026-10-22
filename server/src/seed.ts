import { config } from './config.js';
import { createPool, migrate } from './db.js';
import type { Pool } from './db.js';
import { slugify } from './lib/slug.js';

type Seed = { name: string; maker: string; kind: string; platforms: string[]; needs: string[]; cost: string; summary: string; url: string };

export const seedTools: Seed[] = [
  { name: 'NVDA', maker: 'NV Access', kind: 'Screen reader', platforms: ['Windows'], needs: ['Read the screen aloud'], cost: 'Free and open source',
    summary: 'Reads what is on a Windows computer with speech and braille. Works with web browsers, email and office programs.', url: 'https://www.nvaccess.org/' },
  { name: 'Narrator', maker: 'Microsoft', kind: 'Screen reader', platforms: ['Windows'], needs: ['Read the screen aloud'], cost: 'Built in to Windows',
    summary: 'The screen reader that comes with Windows. Nothing to install, so it is a quick way to try a screen reader.', url: 'https://www.microsoft.com/accessibility' },
  { name: 'Orca', maker: 'GNOME Project', kind: 'Screen reader', platforms: ['Linux'], needs: ['Read the screen aloud'], cost: 'Free and open source',
    summary: 'A free screen reader for the GNOME desktop on Linux, with speech and braille output.', url: 'https://orca.gnome.org/' },
  { name: 'VoiceOver', maker: 'Apple', kind: 'Screen reader', platforms: ['iPhone and iPad', 'Mac'], needs: ['Read the screen aloud'], cost: 'Built in to Apple devices',
    summary: 'The screen reader built into iPhone, iPad and Mac. Use gestures on a phone or keyboard commands on a Mac.', url: 'https://www.apple.com/accessibility/' },
  { name: 'TalkBack', maker: 'Google', kind: 'Screen reader', platforms: ['Android'], needs: ['Read the screen aloud'], cost: 'Built in to Android',
    summary: 'The screen reader built into Android phones. It speaks what you touch and lets you control the phone by gestures.', url: 'https://support.google.com/accessibility/android/answer/6283677' },
  { name: 'Be My Eyes', maker: 'Be My Eyes', kind: 'Mobile app', platforms: ['iPhone and iPad', 'Android'], needs: ['Get live help'], cost: 'Free app',
    summary: 'Connects blind and low-vision people with sighted volunteers over a video call for quick help with everyday tasks.', url: 'https://www.bemyeyes.com/' },
  { name: 'Seeing AI', maker: 'Microsoft', kind: 'Mobile app', platforms: ['iPhone and iPad'], needs: ['Describe my surroundings'], cost: 'Free app',
    summary: 'Uses the phone camera to read short text and documents and to describe what is around you. Check the official site for other platforms.', url: 'https://www.seeingai.com/' },
];

export async function seed(pool: Pool): Promise<number> {
  let added = 0;
  for (const t of seedTools) {
    const { rowCount } = await pool.query(
      `insert into tools (slug, name, maker, kind, platforms, needs, cost, summary, url, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published') on conflict (slug) do nothing`,
      [slugify(t.name), t.name, t.maker, t.kind, t.platforms, t.needs, t.cost, t.summary, t.url]);
    added += rowCount ?? 0;
  }
  return added;
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  const pool = createPool(config.databaseUrl, config.dbSsl);
  await migrate(pool);
  console.log(`Seeded ${await seed(pool)} new tools.`);
  await pool.end();
}
