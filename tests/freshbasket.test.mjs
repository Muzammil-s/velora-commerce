import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCartTotals, computeDailyValues, escapeHtml, filterAndSortProducts, formatPKR } from '../src/storeLogic.js';

const SAMPLE_PRODUCTS = [
  { id: 101, name: 'Swat Gala Apples', category: 'Fresh Produce', price: 360, oldPrice: 420, inStock: true, dietary: ['100% Halal', 'Farm Organic'], nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 } },
  { id: 107, name: 'Boneless Chicken Breast', category: 'Meat & Seafood', price: 1150, oldPrice: 1290, inStock: true, dietary: ['100% Halal', 'High Protein'], nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 } },
  { id: 109, name: 'Kernel Basmati Rice', category: 'Pantry & Masala', price: 1850, oldPrice: 2150, inStock: true, dietary: ['100% Halal', 'Gluten-Free'], nutrition: { calories: 350, protein: 7.5, carbs: 78, fat: 0.6, fiber: 1.4 } },
  { id: 199, name: 'Sold Out Item', category: 'Beverages', price: 500, oldPrice: null, inStock: false, dietary: ['100% Halal'], nutrition: { calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0 } }
];

test('cart totals enforce free delivery threshold at Rs. 2,500 and promo codes', () => {
  const below = calculateCartTotals({ 101: 2 }, SAMPLE_PRODUCTS, { appliedPromo: 'PAK10', slotType: 'express' });
  assert.equal(below.subtotal, 720);
  assert.equal(below.deliveryFee, 150);
  assert.equal(below.discount, 72);
  assert.equal(below.grandTotal, 798);

  const above = calculateCartTotals({ 107: 1, 109: 1 }, SAMPLE_PRODUCTS, { appliedPromo: 'FRESH20', slotType: 'express' });
  assert.equal(above.subtotal, 3000);
  assert.equal(above.deliveryFee, 0);
  assert.equal(above.discount, 600);
  assert.equal(above.grandTotal, 2400);

  const scheduled = calculateCartTotals({ 101: 1, 199: 2 }, SAMPLE_PRODUCTS, { slotType: 'scheduled' });
  assert.equal(scheduled.subtotal, 360);
  assert.equal(scheduled.deliveryFee, 0);
  assert.equal(scheduled.totalItems, 1);
});

test('filterAndSortProducts filters by dietary, wishlist, search, and sorts by protein', () => {
  const favs = new Set([101, 109]);
  const favItems = filterAndSortProducts(SAMPLE_PRODUCTS, { dietary: 'favorites', wishlist: favs });
  assert.equal(favItems.length, 2);

  const proteinSorted = filterAndSortProducts(SAMPLE_PRODUCTS, { dietary: '100% Halal', sortBy: 'protein' });
  assert.equal(proteinSorted[0].id, 107);
});

test('formatPKR, escapeHtml, and computeDailyValues work cleanly', () => {
  assert.match(formatPKR(2500), /^Rs\. 2,500$/);
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  const dv = computeDailyValues({ calories: 200, protein: 25, carbs: 55, fat: 39, fiber: 14 });
  assert.equal(dv.calDV, 10);
  assert.equal(dv.protDV, 50);
  assert.equal(dv.fiberDV, 50);
});
