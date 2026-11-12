export const FREE_DELIVERY_THRESHOLD = 2500;
export const STANDARD_DELIVERY_FEE = 150;

export function formatPKR(amount) {
  return 'Rs. ' + Math.round(Number(amount) || 0).toLocaleString('en-PK');
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function calculateCartTotals(cart, products, { appliedPromo = null, slotType = 'express' } = {}) {
  let subtotal = 0;
  let totalItems = 0;

  for (const [id, qty] of Object.entries(cart || {})) {
    const prod = products.find((p) => p.id === Number(id));
    if (prod && prod.inStock && qty > 0) {
      subtotal += prod.price * qty;
      totalItems += qty;
    }
  }

  const isScheduledFree = slotType === 'scheduled';
  const deliveryFee =
    totalItems === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD || isScheduledFree ? 0 : STANDARD_DELIVERY_FEE;

  let discountRate = 0;
  if (appliedPromo === 'FRESH20') discountRate = 0.2;
  else if (appliedPromo === 'PAK10') discountRate = 0.1;

  const discount = Math.round(subtotal * discountRate);
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  return { subtotal, totalItems, deliveryFee, discount, grandTotal };
}

export function filterAndSortProducts(
  products,
  { category = 'all', dietary = 'all', search = '', sortBy = 'featured', wishlist = new Set() } = {}
) {
  const q = String(search || '').trim().toLowerCase();
  const list = products.filter((p) => {
    const matchesCat = category === 'all' || p.category === category;
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.badge || '').toLowerCase().includes(q) ||
      (p.dietary && p.dietary.some((d) => d.toLowerCase().includes(q)));

    let matchesDiet = true;
    if (dietary === 'sale') matchesDiet = Boolean(p.oldPrice && p.oldPrice > p.price);
    else if (dietary === 'favorites') matchesDiet = wishlist.has(p.id);
    else if (dietary !== 'all') matchesDiet = Boolean(p.dietary && p.dietary.includes(dietary));

    return matchesCat && matchesSearch && matchesDiet;
  });

  if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sortBy === 'protein') list.sort((a, b) => ((b.nutrition && b.nutrition.protein) || 0) - ((a.nutrition && a.nutrition.protein) || 0));
  else if (sortBy === 'discount') {
    list.sort((a, b) => {
      const da = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
      const db = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
      return db - da;
    });
  }
  return list;
}

export function computeDailyValues(nutrition = {}) {
  return {
    calDV: Math.min(100, Math.round(((nutrition.calories || 0) / 2000) * 100)),
    protDV: Math.min(100, Math.round(((nutrition.protein || 0) / 50) * 100)),
    carbDV: Math.min(100, Math.round(((nutrition.carbs || 0) / 275) * 100)),
    fatDV: Math.min(100, Math.round(((nutrition.fat || 0) / 78) * 100)),
    fiberDV: Math.min(100, Math.round(((nutrition.fiber || 0) / 28) * 100))
  };
}
