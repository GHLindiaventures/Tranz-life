// The Twilio Verify connection, against a fake Twilio: what we send, and how Twilio's answers become ours.
import { describe, expect, it } from 'vitest';
import { createTwilioVerify } from '../src/modules/auth/otp.twilio.js';
import { silent } from './helpers.js';

const SID = 'AC' + '0'.repeat(32), TOKEN = 'auth-token', SERVICE = 'VA' + '1'.repeat(32);

function fakeTwilio(answer){
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, auth:init.headers.Authorization, form:Object.fromEntries(new URLSearchParams(init.body)) });
    const [status, body] = answer(url);
    return new Response(JSON.stringify(body), { status, headers:{ 'Content-Type':'application/json' } });
  };
  return { calls, twilio:createTwilioVerify({ accountSid:SID, authToken:TOKEN, serviceSid:SERVICE, fetchImpl, log:silent }) };
}

describe('Twilio Verify', () => {
  it('texts a code to the +91 number, with the account SID and auth token', async () => {
    const { calls, twilio } = fakeTwilio(() => [201, { status:'pending' }]);
    expect(await twilio.send('9876543210')).toEqual({});
    expect(calls[0]).toEqual({
      url:`https://verify.twilio.com/v2/Services/${SERVICE}/Verifications`,
      auth:'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64'),
      form:{ To:'+919876543210', Channel:'sms' }
    });
  });

  it('says a code is right only when Twilio approves it', async () => {
    let status = 'approved';
    const { calls, twilio } = fakeTwilio(() => [200, { status }]);
    expect(await twilio.check('9876543210', '123456')).toBe(true);
    expect(calls[0].form).toEqual({ To:'+919876543210', Code:'123456' });
    status = 'pending';
    expect(await twilio.check('9876543210', '000000')).toBe(false);
  });

  it("turns Twilio's errors into messages a customer understands, and hides the rest", async () => {
    const fails = async (code, httpStatus = 400) => {
      const { twilio } = fakeTwilio(() => [httpStatus, { code, message:'twilio says no' }]);
      return twilio.send('9876543210').catch(err => ({ status:err.status, code:err.code, message:err.message }));
    };
    expect(await fails(60200)).toMatchObject({ status:400, code:'invalid' });
    expect(await fails(60203, 429)).toMatchObject({ status:429, code:'busy' });
    expect(await fails(20404, 404)).toMatchObject({ status:410, code:'expired' });
    const hidden = await fails(20003, 401); // wrong auth token: our problem, not the customer's
    expect(hidden).toMatchObject({ status:503, code:'unavailable' });
    expect(hidden.message).not.toMatch(/twilio says no/);
  });

  it('says so when Twilio cannot be reached', async () => {
    const twilio = createTwilioVerify({ accountSid:SID, authToken:TOKEN, serviceSid:SERVICE, log:silent, fetchImpl:async () => { throw new Error('offline'); } });
    await expect(twilio.send('9876543210')).rejects.toMatchObject({ status:503 });
  });
});
