import api from '../api';

const BASE_PATH = '/api/products';

export async function fetchProducts(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchProduct(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createProduct(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateProduct(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteProduct(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

