import api from './api';

export const reviewService = {
  // Avis d'un produit (public)
  getProductReviews: (slug) => api.get(`/products/${slug}/reviews/`),

  // Publier un avis (utilisateur connecté) : { rating, title, comment }
  createReview: (slug, payload) => api.post(`/products/${slug}/reviews/`, payload),

  // Avis de l'utilisateur connecté (page profil)
  getMyReviews: () => api.get('/products/reviews/me/'),
};