import api from '../api';

const BASE_PATH = '/api/clients';

export async function fetchClients(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchClient(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createClient(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateClient(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteClient(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function fetchClientHistory(clientId, params = {}) {
  const response = await api.get(`${BASE_PATH}/${clientId}/history`, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchClientMedia(clientId, params = {}) {
  const response = await api.get(`${BASE_PATH}/${clientId}/media`, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function uploadClientMedia(clientId, payload) {
  const response = await api.post(`${BASE_PATH}/${clientId}/media`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteClientMedia(mediaId) {
  const response = await api.delete(`/api/client-media/${mediaId}`);
  return response.data ?? null;
}

