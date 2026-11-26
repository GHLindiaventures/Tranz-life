// Brings the database tables up to date. Each file in migrations/ runs once, in name order (001_, 002_, …), and is
// recorded in schema_migrations. To change the tables later, add a new numbered file; never edit one that has run.
// Runs when the server starts, or on its own with `npm run migrate` (for example as a deploy step).
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DIR = new URL('./migrations/', import.meta.url);
const LOCK = 7274_2601; // any fixed number: stops two servers starting at once from migrating together

async function migrate(db, log = console){
  const files = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();
  const applied = await db.tx(async t => {
    await t.query('SELECT pg_advisory_xact_lock($1)', [LOCK]);
    await t.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const done = new Set((await t.query('SELECT name FROM schema_migrations')).map(r => r.name));
    const run = [];
    for (const name of files.filter(f => !done.has(f))){
      await t.exec(readFileSync(new URL(name, DIR), 'utf8'));
      await t.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      run.push(name);
    }
    return run;
  });
  for (const name of applied) log.info(`[db] applied migration ${name}`);
  return applied;
}

// `npm run migrate`: migrate the database in backend/.env, then stop
if (import.meta.url === pathToFileURL(process.argv[1] || '').href){
  const { loadSettings } = await import('../config.js');
  const { connectDb } = await import('./index.js');
  const config = loadSettings();
  const db = await connectDb({ url:config.databaseUrl, dir:config.localDbDir });
  const run = await migrate(db);
  console.log(run.length ? `Done: ${run.length} migration(s) applied.` : 'The database is already up to date.');
  await db.close();
}

export { migrate };
