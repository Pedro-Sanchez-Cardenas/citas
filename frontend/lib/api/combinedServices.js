import api from '../api';

const BASE_PATH = '/api/combined-services';

export async function fetchCombinedServices(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchCombinedService(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createCombinedService(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateCombinedService(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteCombinedService(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

