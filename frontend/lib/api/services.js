import api from '../api';

const BASE_PATH = '/api/services';

export async function fetchServices(params = {}) {
  const response = await api.get(BASE_PATH, { params });
  return response.data?.data ?? response.data ?? [];
}

export async function fetchService(id) {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return response.data?.data ?? response.data ?? null;
}

export async function createService(payload) {
  const response = await api.post(BASE_PATH, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function updateService(id, payload) {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteService(id) {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function fetchServiceProfessionals(serviceId, params = {}) {
  const response = await api.get(`${BASE_PATH}/${serviceId}/professionals`, {
    params,
  });
  return response.data?.data ?? response.data ?? [];
}

export async function syncServiceProfessionals(serviceId, payload) {
  const response = await api.put(
    `${BASE_PATH}/${serviceId}/professionals`,
    payload
  );
  return response.data?.data ?? response.data ?? null;
}

export async function fetchServiceMaterials(serviceId, params = {}) {
  const response = await api.get(`${BASE_PATH}/${serviceId}/materials`, {
    params,
  });
  return response.data?.data ?? response.data ?? [];
}

export async function syncServiceMaterials(serviceId, payload) {
  const response = await api.put(
    `${BASE_PATH}/${serviceId}/materials`,
    payload
  );
  return response.data?.data ?? response.data ?? null;
}


