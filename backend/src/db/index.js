// The database connection. The database is PostgreSQL:
//   live:           DATABASE_URL points at a hosted Postgres (Neon, Supabase, AWS RDS, …), through the `pg` driver
//   your computer:  no DATABASE_URL, so the same Postgres runs inside Node (PGlite), saved in backend/.data/db
//   tests:          PGlite in memory, fresh for each test file
// Whichever it is, the rest of the backend sees the same four functions:
//   db.query(sql, params) -> array of rows
//   db.one(sql, params)   -> the first row, or null
//   db.exec(sql)          -> runs several statements (migrations)
//   db.tx(async t => …)   -> runs the callback in one transaction; `t` has query/one/exec too
//   db.close()

// wraps anything with a pg-style query(sql, params) -> { rows }
const runner = conn => ({
  query:async (sql, params = []) => (await conn.query(sql, params)).rows,
  one:async (sql, params = []) => (await conn.query(sql, params)).rows[0] ?? null
});

async function connectPostgres(url){
  const { default:pg } = await import('pg');
  const pool = new pg.Pool({ connectionString:url, max:5 });
  return {
    kind:'postgres',
    ...runner(pool),
    exec:sql => pool.query(sql),
    async tx(fn){
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn({ ...runner(client), exec:sql => client.query(sql) });
        await client.query('COMMIT');
        return out;
      } catch(err){
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally { client.release(); }
    },
    close:() => pool.end()
  };
}

async function connectLocal(dir){
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;
  return {
    kind:dir ? 'local' : 'memory',
    ...runner(pg),
    exec:sql => pg.exec(sql),
    tx:fn => pg.transaction(t => fn({ ...runner(t), exec:sql => t.exec(sql) })),
    close:() => pg.close()
  };
}

// { url } for a hosted Postgres, { dir } for a local one saved on disk, {} for one in memory (tests)
function connectDb({ url = '', dir = '' } = {}){
  return url ? connectPostgres(url) : connectLocal(dir);
}

export { connectDb };
