// Entry point for "The Living Banyan" (banyan.html): the prototype of the new, light homepage.
import './styles/banyan.css';
import { initBanyan } from './features/banyan/stage.js';
import gummies from './assets/products/gummies.webp';
import inhaler from './assets/products/inhaler.webp';
import rollon from './assets/products/rollon.webp';
import reviva from './assets/products/reviva.webp';
import liver from './assets/products/liver.webp';
import energy from './assets/products/energy.webp';

// the six products, in the order their roots meet the ground (plain names, as agreed with the client)
const PRODUCTS = [
  { id: 'gummies', name: 'Lung Booster Gummies', img: gummies },
  { id: 'inhaler', name: 'Aroma Inhaler', img: inhaler },
  { id: 'rollon', name: 'CycleRelief Roll-On', img: rollon },
  { id: 'reviva', name: 'Reviva Roll-On', img: reviva },
  { id: 'liver', name: 'Liver Booster', img: liver },
  { id: 'energy', name: 'Energy Booster', img: energy }
];

initBanyan(PRODUCTS);
