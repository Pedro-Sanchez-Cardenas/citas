import api from '../api';

const BASE_PATH = '/api/professionals';

export async function fetchProfessionals(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchProfessional(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createProfessional(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateProfessional(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteProfessional(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

