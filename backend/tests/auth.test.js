// Customer login with a one-time code: asking for codes (and the limits on it), checking them, the login cookie,
// new and returning customers, and logging out.
import { describe, expect, it } from 'vitest';
import { createTestCodes } from '../src/modules/auth/otp.test-mode.js';
import { useTestApi } from './helpers.js';

const api = useTestApi();
const PHONE = '9876543210';
const askCode = (phone = PHONE) => api.post('/api/auth/otp', { phone });
const verify = (code, phone = PHONE) => api.post('/api/auth/verify', { phone, code });

describe('asking for a code', () => {
  it('accepts Indian mobile numbers written any usual way, and refuses others', async () => {
    expect(await api.json(await askCode('+91 98765 43210'))).toMatchObject({ status:200, kind:'phone', to:PHONE, resendIn:30 });
    expect((await askCode('12345')).status).toBe(400);
    expect((await askCode('5876543210')).status).toBe(400); // Indian mobiles start 6-9
  });

  it('waits 30 seconds between codes for one number, and caps codes per number per hour', async () => {
    await askCode();
    const again = await api.json(await askCode());
    expect(again).toMatchObject({ status:429, code:'busy' });
    expect(again.error).toMatch(/wait \d+ seconds/);

    // five codes in the last hour (each over 30 seconds apart) is the most for one number
    await api.db.exec(`INSERT INTO otp_requests (target, ip, created_at) SELECT '9123456780', 'x', now() - (n * interval '5 minutes') FROM generate_series(1, 5) n`);
    expect(await api.json(await askCode('9123456780'))).toMatchObject({ status:429, error:expect.stringMatching(/an hour/) });
  });

  it('says login is not available when no code sender is set up', async () => {
    api.use({ codes:null });
    expect((await askCode()).status).toBe(503);
    expect(await (await api.get('/api/me')).json()).toEqual({ user:null, login:null, emailLogin:false });
  });
});

describe('verifying the code', () => {
  it('logs a new number in as a new customer, with an HttpOnly cookie only sent to /api', async () => {
    const { testCode } = await (await askCode()).json();
    expect(testCode).toMatch(/^\d{6}$/);
    const res = await verify(testCode);
    expect(await res.json()).toMatchObject({ isNew:true, user:{ phone:PHONE, name:'', addresses:[] } });
    const cookie = res.headers.getSetCookie()[0];
    expect(cookie).toMatch(/^tl_session=[a-f0-9]{64};/);
    expect(cookie).toMatch(/Path=\/api/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    // the database keeps only a hash of the token
    const token = cookie.split(';')[0].split('=')[1];
    expect((await api.db.one('SELECT token_hash FROM sessions')).token_hash).not.toBe(token);
  });

  it('knows a returning customer', async () => {
    await api.login();
    await api.db.exec("DELETE FROM otp_requests"); // skip the 30-second wait
    const { testCode } = await (await askCode()).json();
    expect(await (await verify(testCode)).json()).toMatchObject({ isNew:false });
    expect((await api.db.query('SELECT id FROM customers'))).toHaveLength(1);
  });

  it('refuses a wrong code, stops after five tries, and a used code cannot be used again', async () => {
    const { testCode } = await (await askCode()).json();
    const wrong = testCode === '000000' ? '111111' : '000000';
    expect(await api.json(await verify(wrong))).toMatchObject({ status:400, code:'wrong_code' });
    expect((await verify(testCode)).status).toBe(200);
    expect(await api.json(await verify(testCode))).toMatchObject({ status:410, code:'expired' });

    await api.db.exec("DELETE FROM otp_requests");
    await askCode();
    for (let i = 0; i < 5; i++) await verify(wrong);
    expect(await api.json(await verify(wrong))).toMatchObject({ status:429, code:'too_many' });
  });

  it('refuses a code that has run out', async () => {
    const { testCode } = await (await askCode()).json();
    await api.db.exec("UPDATE test_codes SET expires_at = now() - interval '1 second'");
    expect((await verify(testCode)).status).toBe(410);
  });
});

describe('being logged in', () => {
  it('shows who is logged in, and nobody after logging out', async () => {
    const cookie = await api.login();
    expect(await (await api.get('/api/me', cookie)).json()).toMatchObject({ login:'test', user:{ phone:PHONE } });
    expect((await api.post('/api/auth/logout', {}, cookie)).headers.getSetCookie()[0]).toMatch(/tl_session=;/);
    expect(await (await api.get('/api/me', cookie)).json()).toMatchObject({ user:null });
  });

  it('ignores made-up and expired login cookies', async () => {
    expect((await (await api.get('/api/me', { Cookie:`tl_session=${'a'.repeat(64)}` })).json()).user).toBeNull();
    expect((await (await api.get('/api/me', { Cookie:'tl_session=not-a-token' })).json()).user).toBeNull();
    const cookie = await api.login();
    await api.db.exec("UPDATE sessions SET expires_at = now() - interval '1 second'");
    expect((await (await api.get('/api/me', cookie)).json()).user).toBeNull();
  });
});

describe('logging in with an email address', () => {
  const EMAIL = 'asha@example.com';
  const askEmailCode = (email = EMAIL) => api.post('/api/auth/otp', { email });
  const verifyEmail = (code, email = EMAIL) => api.post('/api/auth/verify', { email, code });

  it('sends a code to the address (lower-cased) and refuses addresses that are not real', async () => {
    expect(await api.json(await askEmailCode(' Asha@Example.COM '))).toMatchObject({ status:200, kind:'email', to:EMAIL, resendIn:30 });
    expect(await api.json(await askEmailCode('asha@'))).toMatchObject({ status:400, error:expect.stringMatching(/valid email/) });
  });

  it('makes a new customer who logs in with that address, with it as their contact email too', async () => {
    const { testCode } = await (await askEmailCode()).json();
    const res = await api.json(await verifyEmail(testCode));
    expect(res).toMatchObject({ isNew:true, user:{ phone:null, loginEmail:EMAIL, email:EMAIL } });
    expect(await api.json(await verifyEmail(testCode))).toMatchObject({ status:410 }); // a code works once

    await api.db.exec('DELETE FROM otp_requests');
    const again = await (await askEmailCode()).json();
    expect(await (await verifyEmail(again.testCode)).json()).toMatchObject({ isNew:false, user:{ loginEmail:EMAIL } });
  });

  it('is refused when codes cannot go by email', async () => {
    const codes = createTestCodes({ db:api.db }); codes.email = false;
    api.use({ codes });
    expect(await api.json(await askEmailCode())).toMatchObject({ status:503, error:expect.stringMatching(/mobile number/) });
    expect((await (await api.get('/api/me')).json()).emailLogin).toBe(false);
  });

  it("never logs into someone else's account because their address is typed into a profile", async () => {
    const ravi = await api.login('9123456780');
    await api.post('/api/me', { name:'Ravi', email:EMAIL }, ravi);   // Ravi types Asha's address as his contact email
    const { testCode } = await (await askEmailCode()).json();
    const asha = await (await verifyEmail(testCode)).json();
    expect(asha).toMatchObject({ isNew:true, user:{ loginEmail:EMAIL, phone:null } });
    expect(asha.user.name).not.toBe('Ravi');
    expect(await api.db.query('SELECT count(*)::int AS n FROM customers')).toEqual([{ n:2 }]);
  });
});
