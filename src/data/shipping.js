// Delivery charges, order limits and delivery states for the checkout.
// Shared by the browser checkout and the payment server (server/), which works out the amount to charge.
// The fee and the free-delivery threshold are placeholders until the client confirms them.
const SHIPPING = { freeFrom:999, fee:49, maxQty:10, maxLines:10, currency:'INR' };

// Indian states and union territories, for the delivery address
const STATES = [
  'Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir',
  'Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal'
];

export { SHIPPING, STATES };
