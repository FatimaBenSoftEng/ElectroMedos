import api from './api';

export const orderService = {
  getCart: () => api.get('/orders/cart/'),
  addToCart: (productId, quantity = 1) =>
    api.post('/orders/cart/add/', { product_id: productId, quantity }),
  updateCartItem: (itemId, quantity) =>
    api.patch(`/orders/cart/items/${itemId}/`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/orders/cart/items/${itemId}/`),
  clearCart: () => api.delete('/orders/cart/'),
  checkout: (data) => api.post('/orders/checkout/', data),
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),

  adminGetOrders: (params) => api.get('/orders/admin/', { params }),
  adminGetOrder: (id) => api.get(`/orders/admin/${id}/`),
  adminUpdateOrderStatus: (id, status) =>
    api.patch(`/orders/admin/${id}/`, { status }),
};
