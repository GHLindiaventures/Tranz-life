// Code the backend shares with the website, so prices, order maths and form checks can never disagree.
// These are plain functions in the website's src/ folder; this file is the only place the backend reaches into it.
export { OrderError, orderRef, priceOrder, REF_PATTERN, toPaise } from '../../../src/utils/order.js';
export { checkCustomer, normalisePhone, normaliseUtr, upiUri, validEmail, validUpiId } from '../../../src/utils/payment.js';
export { checkAddress, checkProfile, DELIVERY_STEPS } from '../../../src/utils/account.js';
