// Picks who sends login codes: Twilio when its keys are set, test mode when OTP_TEST_MODE=true, otherwise nobody
// (login is then off). Both senders have the same two functions:
//   send(phone)        -> { testCode? }   phone: 10-digit Indian mobile number
//   check(phone, code) -> true | false     (throws for an expired code or too many tries)
import { createTestCodes } from './otp.test-mode.js';
import { createTwilioVerify } from './otp.twilio.js';

function chooseCodeSender({ config, db, log, fetchImpl }){
  if (config.twilio) return createTwilioVerify({ ...config.twilio, fetchImpl, log });
  if (config.otpTestMode) return createTestCodes({ db });
  return null;
}

export { chooseCodeSender };
