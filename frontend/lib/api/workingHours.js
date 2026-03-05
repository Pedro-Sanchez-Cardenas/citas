import api from '../api';

const BASE_PATH = '/api/working-hours';

export async function fetchWorkingHours(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchWorkingHour(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createWorkingHour(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateWorkingHour(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteWorkingHour(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

