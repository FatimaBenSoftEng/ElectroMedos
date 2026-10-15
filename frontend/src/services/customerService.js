import api from './api';

export const customerService = {
  adminGetCustomers: (params) => api.get('/auth/customers/', { params }),
  adminUpdateCustomer: (id, data) => api.patch(`/auth/customers/${id}/`, data),
};
