// Account checks shared by the website and the backend: profile and saved addresses.
import { describe, expect, it } from 'vitest';
import { checkAddress, checkProfile, DELIVERY_STEPS } from '../../src/utils/account.js';

const home = { name:'Asha Rao', phone:'+91 98765 43210', address:'12 MG Road, Indiranagar', city:'Bengaluru', state:'Karnataka', pincode:'560038' };

describe('checkProfile', () => {
  it('tidies the name and email, and keeps only known genders', () => {
    expect(checkProfile({ name:'  Asha   Rao ', email:'ASHA@Example.com', gender:'robot' }))
      .toEqual({ profile:{ name:'Asha Rao', email:'asha@example.com', gender:'' }, errors:null });
  });

  it('needs a name; the email is optional but must be real when given', () => {
    expect(checkProfile({ name:'A' }).errors).toEqual({ name:'Please add your name.' });
    expect(checkProfile({ name:'Asha', email:'' }).errors).toBeNull();
    expect(checkProfile({ name:'Asha', email:'asha@' }).errors).toHaveProperty('email');
  });
});

describe('checkAddress', () => {
  it('normalises the phone number and defaults the label to home', () => {
    const { address, errors } = checkAddress(home);
    expect(errors).toBeNull();
    expect(address).toMatchObject({ phone:'9876543210', label:'home', landmark:'' });
  });

  it('names every field that is wrong', () => {
    const { errors } = checkAddress({ ...home, phone:'123', state:'Atlantis', pincode:'01234', city:'' });
    expect(Object.keys(errors).sort()).toEqual(['city', 'phone', 'pincode', 'state']);
  });

  it('knows the delivery steps in order', () => {
    expect(DELIVERY_STEPS).toEqual(['packed', 'shipped', 'out_for_delivery', 'delivered']);
  });
});
