// SQL for customers and their address books. Each function takes `db` (the database or a transaction) first, runs one
// small query, and returns plain objects in the shape the API uses (camelCase).

// phone and loginEmail are how the customer logs in (either can be null, not both); email is their contact email
const toCustomer = r => r && ({
  id:r.id, phone:r.phone, loginEmail:r.login_email, name:r.name, email:r.email, gender:r.gender, memberSince:r.created_at
});
const toAddress = r => r && ({
  id:r.id, name:r.name, phone:r.phone, address:r.address, landmark:r.landmark, city:r.city, state:r.state,
  pincode:r.pincode, label:r.label, isDefault:r.is_default
});
const ADDRESS_COLUMNS = 'id, name, phone, address, landmark, city, state, pincode, label, is_default';

// ---------- customers ----------
async function findCustomerById(db, id){
  return toCustomer(await db.one('SELECT * FROM customers WHERE id = $1', [id]));
}

async function findCustomerByPhone(db, phone){
  return toCustomer(await db.one('SELECT * FROM customers WHERE phone = $1', [phone]));
}

async function findCustomerByLoginEmail(db, email){
  return toCustomer(await db.one('SELECT * FROM customers WHERE login_email = $1', [email]));
}

// the customer who logs in with this mobile number or email address, created if it is new. Returns { customer, isNew }.
// login: { kind:'phone', value:'9876543210' } or { kind:'email', value:'asha@example.com' }
async function findOrCreateCustomer(db, { kind, value }){
  const created = kind === 'email'
    // a new email customer: the address is their contact email too
    ? await db.one('INSERT INTO customers (login_email, email) VALUES ($1, $1) ON CONFLICT (login_email) DO NOTHING RETURNING *', [value])
    : await db.one('INSERT INTO customers (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING RETURNING *', [value]);
  if (created) return { customer:toCustomer(created), isNew:true };
  const customer = kind === 'email' ? await findCustomerByLoginEmail(db, value) : await findCustomerByPhone(db, value);
  return { customer, isNew:false };
}

async function recordLogin(db, id){
  await db.query('UPDATE customers SET last_login_at = now() WHERE id = $1', [id]);
}

async function updateProfile(db, id, { name, email, gender }){
  return toCustomer(await db.one('UPDATE customers SET name = $2, email = $3, gender = $4 WHERE id = $1 RETURNING *', [id, name, email, gender]));
}

// ---------- addresses ----------
async function listAddresses(db, customerId){
  const rows = await db.query(`SELECT ${ADDRESS_COLUMNS} FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at`, [customerId]);
  return rows.map(toAddress);
}

async function countAddresses(db, customerId){
  return Number((await db.one('SELECT count(*) AS n FROM addresses WHERE customer_id = $1', [customerId])).n);
}

async function insertAddress(db, customerId, a, isDefault){
  const row = await db.one(
    `INSERT INTO addresses (customer_id, name, phone, address, landmark, city, state, pincode, label, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${ADDRESS_COLUMNS}`,
    [customerId, a.name, a.phone, a.address, a.landmark, a.city, a.state, a.pincode, a.label, isDefault]);
  return toAddress(row);
}

async function updateAddress(db, customerId, id, a){
  const row = await db.one(
    `UPDATE addresses SET name = $3, phone = $4, address = $5, landmark = $6, city = $7, state = $8, pincode = $9, label = $10
     WHERE id = $1 AND customer_id = $2 RETURNING ${ADDRESS_COLUMNS}`,
    [id, customerId, a.name, a.phone, a.address, a.landmark, a.city, a.state, a.pincode, a.label]);
  return toAddress(row);
}

// returns the deleted address, or null when it was not this customer's
async function deleteAddress(db, customerId, id){
  return toAddress(await db.one(`DELETE FROM addresses WHERE id = $1 AND customer_id = $2 RETURNING ${ADDRESS_COLUMNS}`, [id, customerId]));
}

// makes one address the default (and no other). Returns false when the address is not this customer's.
async function setDefaultAddress(db, customerId, id){
  await db.query('UPDATE addresses SET is_default = false WHERE customer_id = $1 AND is_default AND id <> $2', [customerId, id]);
  return !!(await db.one('UPDATE addresses SET is_default = true WHERE id = $1 AND customer_id = $2 RETURNING id', [id, customerId]));
}

// an address already in the book with the same street address and PIN code (so checkout does not save it twice)
async function findSameAddress(db, customerId, { address, pincode }){
  return toAddress(await db.one(
    `SELECT ${ADDRESS_COLUMNS} FROM addresses WHERE customer_id = $1 AND lower(address) = lower($2) AND pincode = $3`,
    [customerId, address, pincode]));
}

export {
  findCustomerById, findCustomerByPhone, findCustomerByLoginEmail, findOrCreateCustomer, recordLogin, updateProfile,
  listAddresses, countAddresses, insertAddress, updateAddress, deleteAddress, setDefaultAddress, findSameAddress
};
