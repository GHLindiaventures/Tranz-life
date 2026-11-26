// The customer's account: profile and address book. Rules live here; the SQL is in customers.repo.js.
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { checkAddress, checkProfile } from '../../lib/shared.js';
import * as repo from './customers.repo.js';

const MAX_ADDRESSES = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// the first problem in a { field: message } list, as a 400 the form can show next to that field
function invalid(errors){
  const [field, message] = Object.entries(errors)[0];
  const err = badRequest(message); err.field = field;
  return err;
}

function createCustomerService({ db }){
  // what the website gets for the logged-in customer: profile plus address book
  async function account(customer){
    return { ...customer, addresses:await repo.listAddresses(db, customer.id) };
  }

  async function updateProfile(customer, input){
    const { profile, errors } = checkProfile(input);
    if (errors) throw invalid(errors);
    return account(await repo.updateProfile(db, customer.id, profile));
  }

  async function addAddress(customer, input){
    const { address, errors } = checkAddress(input);
    if (errors) throw invalid(errors);
    await db.tx(async t => {
      const count = await repo.countAddresses(t, customer.id);
      if (count >= MAX_ADDRESSES) throw conflict('too_many', `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.`);
      const added = await repo.insertAddress(t, customer.id, address, false);
      if (count === 0 || input.isDefault === true) await repo.setDefaultAddress(t, customer.id, added.id);
    });
    return account(customer);
  }

  async function editAddress(customer, id, input){
    const { address, errors } = checkAddress(input);
    if (errors) throw invalid(errors);
    if (!UUID.test(id) || !await repo.updateAddress(db, customer.id, id, address)) throw notFound('That address is not in your account.');
    return account(customer);
  }

  async function removeAddress(customer, id){
    await db.tx(async t => {
      const removed = UUID.test(id) && await repo.deleteAddress(t, customer.id, id);
      if (!removed) throw notFound('That address is not in your account.');
      if (removed.isDefault){ // the next address becomes the default
        const [next] = await repo.listAddresses(t, customer.id);
        if (next) await repo.setDefaultAddress(t, customer.id, next.id);
      }
    });
    return account(customer);
  }

  async function makeDefault(customer, id){
    const ok = UUID.test(id) && await db.tx(t => repo.setDefaultAddress(t, customer.id, id));
    if (!ok) throw notFound('That address is not in your account.');
    return account(customer);
  }

  // after a logged-in checkout: keep the delivery address in the book, unless it is already there or the book is full
  async function rememberAddress(customerId, delivery){
    const { address, errors } = checkAddress(delivery);
    if (errors || await repo.findSameAddress(db, customerId, address)) return;
    const count = await repo.countAddresses(db, customerId);
    if (count >= MAX_ADDRESSES) return;
    await repo.insertAddress(db, customerId, address, count === 0);
  }

  return { account, updateProfile, addAddress, editAddress, removeAddress, makeDefault, rememberAddress };
}

export { createCustomerService };
