// Shared, mutable app state. Modules read and write through these objects
// (ES module imports are read-only bindings, so plain `let` exports would not work).

// product shot URLs keyed by product id (filled from features/products/product-images.js)
const thumbs = {};


// live handles created during boot
const state = { hero:null, storyApi:null, lenis:null, mol:null };

export { thumbs, state };
