// Customer account checks and order delivery steps. Pure functions, shared by the website and the backend.
import { STATES } from '../data/shipping.js';
import { normalisePhone, validEmail, validPincode } from './payment.js';

const GENDERS = ['', 'female', 'male'];
const ADDRESS_LABELS = ['home', 'work'];
// after payment, an order is packed, shipped, out for delivery, then delivered (the admin moves it along)
const DELIVERY_STEPS = ['packed', 'shipped', 'out_for_delivery', 'delivered'];

const tidy = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
const result = (key, value, errors) => ({ [key]:value, errors:Object.keys(errors).length ? errors : null });

// name, email (optional) and gender. Returns { profile, errors } (errors is null when everything is fine).
function checkProfile(p = {}){
  const profile = { name:tidy(p.name, 80), email:tidy(p.email, 120).toLowerCase(), gender:GENDERS.includes(p.gender) ? p.gender : '' };
  const errors = {};
  if (profile.name.length < 2) errors.name = 'Please add your name.';
  if (profile.email && !validEmail(profile.email)) errors.email = 'Enter a valid email, like you@example.com.';
  return result('profile', profile, errors);
}

// a saved delivery address. Returns { address, errors }.
function checkAddress(a = {}){
  const address = {
    name:tidy(a.name, 80), phone:normalisePhone(a.phone) || '', address:tidy(a.address, 200), landmark:tidy(a.landmark, 80),
    city:tidy(a.city, 60), state:tidy(a.state, 60), pincode:tidy(a.pincode, 10), label:ADDRESS_LABELS.includes(a.label) ? a.label : 'home'
  };
  const errors = {};
  if (address.name.length < 2) errors.name = 'Please add the full name.';
  if (!address.phone) errors.phone = 'Enter a 10-digit Indian mobile number.';
  if (address.address.length < 6) errors.address = 'Add the house number, street and area.';
  if (address.city.length < 2) errors.city = 'Add the town or city.';
  if (!STATES.includes(address.state)) errors.state = 'Choose the state.';
  if (!validPincode(address.pincode)) errors.pincode = 'Enter a 6-digit PIN code.';
  return result('address', address, errors);
}

export { GENDERS, ADDRESS_LABELS, DELIVERY_STEPS, checkProfile, checkAddress };
