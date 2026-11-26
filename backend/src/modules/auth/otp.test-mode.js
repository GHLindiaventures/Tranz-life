// Login codes in test mode (OTP_TEST_MODE=true): we make the code and hand it back so the login screen can show it.
// Nothing is texted, and anyone can log in as any number, so this is only for trying the site out.
// Codes are stored hashed in the test_codes table, last 10 minutes, and allow 5 tries.
import { createHash, randomInt } from 'node:crypto';
import { HttpError } from '../../lib/errors.js';
import { sameSecret } from '../../lib/http.js';

const MAX_TRIES = 5;
const hash = code => createHash('sha256').update(code).digest('hex');

function createTestCodes({ db, makeCode = () => String(randomInt(0, 1e6)).padStart(6, '0') }){
  return {
    name:'test',

    async send(phone){
      const code = makeCode();
      await db.query(
        `INSERT INTO test_codes (phone, code_hash, expires_at) VALUES ($1, $2, now() + interval '10 minutes')
         ON CONFLICT (phone) DO UPDATE SET code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at`,
        [phone, hash(code)]);
      return { testCode:code };
    },

    async check(phone, code){
      const row = await db.one('UPDATE test_codes SET attempts = attempts + 1 WHERE phone = $1 RETURNING code_hash, attempts, expires_at > now() AS live', [phone]);
      if (!row || !row.live) throw new HttpError(410, 'expired', 'This code has expired. Ask for a new one.');
      if (row.attempts > MAX_TRIES) throw new HttpError(429, 'too_many', 'Too many wrong codes. Ask for a new code.');
      if (!sameSecret(hash(code), row.code_hash)) return false;
      await db.query('DELETE FROM test_codes WHERE phone = $1', [phone]);
      return true;
    }
  };
}

export { createTestCodes };
