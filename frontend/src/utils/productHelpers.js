export const CURRENCY = 'MAD';

export function formatPrice(value) {
  const amount = Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // \u00A0 = espace insécable : le nombre et MAD ne sont jamais séparés
  return `${amount}\u00A0${CURRENCY}`;
}

export function getProductDiscount(product) {
  if (!product?.id) return null;
  const discounts = [0, 0, 10, 15, 20, 25, 30];
  const discount = discounts[product.id % discounts.length];
  if (discount === 0) return null;
  return discount;
}

export function getOriginalPrice(product) {
  const discount = getProductDiscount(product);
  if (!discount) return null;
  const price = Number(product.price);
  return price / (1 - discount / 100);
}

export function isNewProduct(product) {
  if (!product?.created_at) return false;
  const created = new Date(product.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return created > thirtyDaysAgo;
}

export function getCategoryImage(slug) {
  const images = {
    smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    ordinateurs: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    accessoires: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
    gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
  };
  return images[slug] || 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400';
}