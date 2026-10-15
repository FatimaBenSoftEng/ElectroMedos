import api from './api';

export const productService = {
  getProducts: (params) => api.get('/products/', { params }),
  getFeatured: () => api.get('/products/featured/'),
  getProduct: (slug) => api.get(`/products/${slug}/`),
  getCategories: () => api.get('/products/categories/'),
  getCategory: (slug) => api.get(`/products/categories/${slug}/`),

  adminGetProducts: (params) => api.get('/products/admin/products/', { params }),
  adminCreateProduct: (data) => api.post('/products/admin/products/', data),
  adminUpdateProduct: (slug, data) => api.patch(`/products/admin/products/${slug}/`, data),
  adminDeleteProduct: (slug) => api.delete(`/products/admin/products/${slug}/`),

  adminGetCategories: () => api.get('/products/admin/categories/'),
  adminCreateCategory: (data) => api.post('/products/admin/categories/', data),
  adminUpdateCategory: (slug, data) => api.patch(`/products/admin/categories/${slug}/`, data),
  adminDeleteCategory: (slug) => api.delete(`/products/admin/categories/${slug}/`),

  uploadImage: (formData) => {
    // Ne pas fixer manuellement le Content-Type : axios calcule
    // automatiquement le boundary correct pour multipart/form-data
    return api.post('/products/admin/products/upload-image/', formData);
  },
};