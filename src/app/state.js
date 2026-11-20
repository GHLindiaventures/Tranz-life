// Shared, mutable app state. Modules read and write through these objects
// (ES module imports are read-only bindings, so plain `let` exports would not work).

// product shot URLs keyed by product id (filled from features/products/product-images.js)
const thumbs = {};

// bag contents: product id -> quantity
const cart = new Map();


// live handles created during boot
// heroFlight: the hero tub's scroll flight down to the product story (features/hero/hero-jar.js); landed = it has arrived
const state = { heroApi:null, storyApi:null, lenis:null, mol:null, heroFlight:{ active:false, landed:false } };

export { thumbs, cart, state };
