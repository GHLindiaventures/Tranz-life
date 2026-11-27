// Login codes in test mode (OTP_TEST_MODE=true): we make the code and hand it back so the login screen can show it.
// Nothing is texted or emailed, and anyone can log in as any number or address, so this is only for trying the site out.
// Codes are stored hashed in the test_codes table (one per mobile number or email address), last 10 minutes, and allow
// 5 tries.
import { createHash, randomInt } from 'node:crypto';
import { HttpError } from '../../lib/errors.js';
import { sameSecret } from '../../lib/http.js';

const MAX_TRIES = 5;
const hash = code => createHash('sha256').update(code).digest('hex');

function createTestCodes({ db, makeCode = () => String(randomInt(0, 1e6)).padStart(6, '0') }){
  return {
    name:'test',
    email:true,

    // login: { kind:'phone' | 'email', value }
    async send({ value }){
      const code = makeCode();
      await db.query(
        `INSERT INTO test_codes (target, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes')
         ON CONFLICT (target) DO UPDATE SET code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at`,
        [value, hash(code)]);
      return { testCode:code };
    },

    async check({ value }, code){
      const row = await db.one('UPDATE test_codes SET attempts = attempts + 1 WHERE target = $1 RETURNING code_hash, attempts, expires_at > now() AS live', [value]);
      if (!row || !row.live) throw new HttpError(410, 'expired', 'This code has expired. Ask for a new one.');
      if (row.attempts > MAX_TRIES) throw new HttpError(429, 'too_many', 'Too many wrong codes. Ask for a new code.');
      if (!sameSecret(hash(code), row.code_hash)) return false;
      await db.query('DELETE FROM test_codes WHERE target = $1', [value]);
      return true;
    }
  };
}

export { createTestCodes };
