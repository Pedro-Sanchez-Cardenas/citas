import api from '@/lib/api';

const BASE_PATH = '/api/appointments';

export async function fetchAppointments(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchAppointment(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createAppointment(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateAppointment(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteAppointment(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function moveAppointment(id, payload) {
  const response = await api.patch(`${BASE_PATH}/${id}/move`, payload);
  return response.data?.data ?? response.data ?? null;
}

