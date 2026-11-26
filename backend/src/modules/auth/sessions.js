// Login sessions, for customers (30 days) and the admin (12 hours).
// The browser keeps a random 64-character token; the database keeps only its SHA-256 hash (see the sessions table).
import { createHash, randomBytes } from 'node:crypto';

const LIFETIME_HOURS = { customer:30 * 24, admin:12 };
const TOKEN = /^[a-f0-9]{64}$/;
const hash = token => createHash('sha256').update(token).digest('hex');

// starts a session and returns { token, maxAgeMs }; the token goes to the browser and is never stored
async function startSession(db, kind, customerId = null){
  const token = randomBytes(32).toString('hex'), hours = LIFETIME_HOURS[kind];
  await db.query("DELETE FROM sessions WHERE expires_at <= now()"); // tidy up old ones now and then
  await db.query(`INSERT INTO sessions (token_hash, kind, customer_id, expires_at) VALUES ($1, $2, $3, now() + make_interval(hours => $4))`,
    [hash(token), kind, customerId, hours]);
  return { token, maxAgeMs:hours * 3600e3 };
}

// the live session for this token, or null. Returns { customerId }.
async function findSession(db, kind, token){
  if (!TOKEN.test(token || '')) return null;
  const row = await db.one('SELECT customer_id FROM sessions WHERE token_hash = $1 AND kind = $2 AND expires_at > now()', [hash(token), kind]);
  return row && { customerId:row.customer_id };
}

async function endSession(db, token){
  if (TOKEN.test(token || '')) await db.query('DELETE FROM sessions WHERE token_hash = $1', [hash(token)]);
}

export { startSession, findSession, endSession };
