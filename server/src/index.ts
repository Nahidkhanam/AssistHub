import { createApp } from './app.js';
import { config } from './config.js';
import { createPool, migrate } from './db.js';
import { seed } from './seed.js';

const pool = createPool(config.databaseUrl, config.dbSsl);
await migrate(pool);
const added = await seed(pool);
if (added) console.log(`Seeded ${added} tools.`);

const server = createApp(pool).listen(config.port, () => console.log(`AssistHub API listening on port ${config.port}`));
const stop = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
