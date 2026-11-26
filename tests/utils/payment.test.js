import { describe, expect, it } from 'vitest';
import { cardBrand, checkCustomer, formatCardNumber, formatExpiry, luhn, normalisePhone, normaliseUtr, parseExpiry, upiUri, validCvv, validPincode, validUpiId } from '../../src/utils/payment.js';

describe('delivery details', () => {
  it('accepts Indian mobile numbers with or without +91 or 0', () => {
    expect(normalisePhone('98765 43210')).toBe('9876543210');
    expect(normalisePhone('+91 98765-43210')).toBe('9876543210');
    expect(normalisePhone('09876543210')).toBe('9876543210');
    expect(normalisePhone('5876543210')).toBeNull();
    expect(normalisePhone('98765')).toBeNull();
  });
  it('checks PIN codes', () => {
    expect(validPincode('560001')).toBe(true);
    expect(validPincode('060001')).toBe(false);
    expect(validPincode('56001')).toBe(false);
  });
  it('tidies a good address and reports each problem field', () => {
    const good = checkCustomer({ name:'  Asha   Rao ', phone:'+919876543210', email:'Asha@Example.com', address:'12 MG Road, Indiranagar', city:'Bengaluru', state:'Karnataka', pincode:'560038' });
    expect(good.errors).toBeNull();
    expect(good.customer).toMatchObject({ name:'Asha Rao', phone:'9876543210', email:'asha@example.com' });
    const bad = checkCustomer({ name:'A', phone:'123', email:'nope', address:'x', city:'', state:'Atlantis', pincode:'1' });
    expect(Object.keys(bad.errors).sort()).toEqual(['address', 'city', 'email', 'name', 'phone', 'pincode', 'state']);
  });
});

describe('cards', () => {
  it('passes the Luhn check for real test numbers only', () => {
    expect(luhn('4111 1111 1111 1111')).toBe(true);
    expect(luhn('4000 0000 0000 0002')).toBe(true);
    expect(luhn('4111 1111 1111 1112')).toBe(false);
    expect(luhn('4111')).toBe(false);
  });
  it('recognises card brands, including RuPay', () => {
    expect(cardBrand('4111111111111111')).toBe('visa');
    expect(cardBrand('5555555555554444')).toBe('mastercard');
    expect(cardBrand('2221000000000009')).toBe('mastercard');
    expect(cardBrand('6521000000000000')).toBe('rupay');
    expect(cardBrand('6070000000000000')).toBe('rupay');
    expect(cardBrand('378282246310005')).toBe('amex');
    expect(cardBrand('9999')).toBeNull();
  });
  it('formats numbers and expiry as the shopper types', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('1')).toBe('1');
  });
  it('accepts an expiry until the end of its month', () => {
    const now = new Date(2026, 10, 23); // 23 Nov 2026
    expect(parseExpiry('11/26', now)).toEqual({ month:11, year:2026 });
    expect(parseExpiry('10/26', now)).toBeNull();
    expect(parseExpiry('13/27', now)).toBeNull();
    expect(parseExpiry('0127', now)).toEqual({ month:1, year:2027 });
  });
  it('needs a 4-digit CVV for Amex and 3 digits otherwise', () => {
    expect(validCvv('123', 'visa')).toBe(true);
    expect(validCvv('1234', 'visa')).toBe(false);
    expect(validCvv('1234', 'amex')).toBe(true);
  });
});

describe('UPI ID and UTR', () => {
  it('recognises UPI IDs', () => {
    expect(validUpiId('tranzlife@okhdfcbank')).toBe(true);
    expect(validUpiId('shop.name-1@ybl')).toBe(true);
    expect(validUpiId('no-at-sign')).toBe(false);
    expect(validUpiId('a@b c')).toBe(false);
  });
  it('accepts a 12-digit UTR, with or without spaces', () => {
    expect(normaliseUtr('4023 1234 5678')).toBe('402312345678');
    expect(normaliseUtr('402312345678')).toBe('402312345678');
    expect(normaliseUtr('40231234567')).toBeNull();
    expect(normaliseUtr('T2311231234567890123')).toBeNull(); // a PhonePe transaction ID is not the UTR
  });
});

describe('UPI link', () => {
  it('builds an NPCI upi://pay link with the exact amount', () => {
    expect(upiUri({ vpa:'shop@okbank', name:'TranzLife Biosciences', amount:1098, note:'Order TL-1' }))
      .toBe('upi://pay?pa=shop@okbank&pn=TranzLife%20Biosciences&am=1098.00&cu=INR&tn=Order%20TL-1');
  });
});
