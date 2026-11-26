// Checkout field checks and card/UPI helpers. Pure functions, shared with the payment server.
import { STATES } from '../data/shipping.js';

const digits = s => String(s ?? '').replace(/\D/g, '');

// Indian mobile number: 10 digits starting 6-9, with or without +91 or a leading 0. Returns the 10 digits or null.
function normalisePhone(s){
  let d = digits(s);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s ?? '').trim());

const validPincode = s => /^[1-9]\d{5}$/.test(String(s ?? '').trim());

// Delivery details: tidies every field and returns { customer, errors } (errors is null when everything is fine)
function checkCustomer(c = {}){
  const s = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
  const customer = {
    name:s(c.name, 80), phone:normalisePhone(c.phone) || '', email:s(c.email, 120).toLowerCase(),
    address:s(c.address, 200), city:s(c.city, 60), state:s(c.state, 60), pincode:s(c.pincode, 10)
  };
  const errors = {};
  if (customer.name.length < 2) errors.name = 'Please add your full name.';
  if (!customer.phone) errors.phone = 'Enter a 10-digit Indian mobile number.';
  if (!validEmail(customer.email)) errors.email = 'Enter a valid email, like you@example.com.';
  if (customer.address.length < 6) errors.address = 'Add your house number, street and area.';
  if (customer.city.length < 2) errors.city = 'Add your town or city.';
  if (!STATES.includes(customer.state)) errors.state = 'Choose your state.';
  if (!validPincode(customer.pincode)) errors.pincode = 'Enter a 6-digit PIN code.';
  return { customer, errors:Object.keys(errors).length ? errors : null };
}

// ---------- cards ----------
// [brand, number prefix, CVV length]. RuPay comes before the brands its ranges overlap.
const BRANDS = [
  ['amex', /^3[47]/, 4],
  ['diners', /^3(0[0-5]|[689])/, 3],
  ['rupay', /^(508[5-9]|60698[5-9]|60699|607|608|6521|6522|81|82|353|356)/, 3],
  ['maestro', /^(5018|5020|5038|6304|6759|676[1-3])/, 3],
  ['mastercard', /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/, 3],
  ['visa', /^4/, 3]
];

function cardBrand(num){
  const d = digits(num), b = BRANDS.find(([, re]) => re.test(d));
  return b ? b[0] : null;
}

// Luhn checksum, which every real card number passes
function luhn(num){
  const d = digits(num);
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++){
    let n = +d[d.length - 1 - i];
    if (i % 2){ n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

// groups of four (Amex: 4-6-5) as the shopper types
function formatCardNumber(num){
  const d = digits(num).slice(0, 19);
  if (cardBrand(d) === 'amex') return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "MMYY" typed -> "MM/YY"
function formatExpiry(s){
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// "MM/YY" -> { month, year } if it is a real month that has not ended yet (cards work until the end of their month), else null
function parseExpiry(s, now = new Date()){
  const m = String(s ?? '').match(/^\s*(\d{1,2})\s*\/?\s*(\d{2})\s*$/);
  if (!m) return null;
  const month = +m[1], year = 2000 + +m[2];
  if (month < 1 || month > 12) return null;
  if (new Date(year, month, 1) <= now) return null;
  if (year > now.getFullYear() + 20) return null;
  return { month, year };
}

function validCvv(cvv, brand){
  const len = (BRANDS.find(b => b[0] === brand) || [])[2] || 3;
  return new RegExp(`^\\d{${len}}$`).test(String(cvv ?? ''));
}

// ---------- UPI ----------
// UPI ID (VPA) such as tranzlife@okhdfcbank
const validUpiId = s => /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(String(s ?? '').trim());

// UTR (UPI reference number, also called RRN): the 12-digit number a UPI app shows for every payment. Returns the digits or null.
function normaliseUtr(s){
  const d = digits(s);
  return /^\d{12}$/.test(d) ? d : null;
}

// UPI payment link (NPCI deep-link format), which is also what a UPI QR code holds
function upiUri({ vpa, name, amount, note }){
  const enc = v => encodeURIComponent(v).replace(/%40/g, '@');
  const parts = [`pa=${enc(vpa)}`, `pn=${enc(name)}`, `am=${Number(amount).toFixed(2)}`, 'cu=INR'];
  if (note) parts.push(`tn=${enc(note)}`);
  return `upi://pay?${parts.join('&')}`;
}

export { normalisePhone, validEmail, validPincode, checkCustomer, cardBrand, luhn, formatCardNumber, formatExpiry, parseExpiry, validCvv, validUpiId, normaliseUtr, upiUri };
