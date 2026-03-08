import api from '@/lib/api';
import type { Service } from '@/types';

const BASE_PATH = '/api/services';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchServices(params: Record<string, unknown> = {}): Promise<Service[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchService(id: number | string): Promise<Service | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<Service | null>(response.data) ?? null;
}

export interface CreateServicePayload {
  name: string;
  [key: string]: unknown;
}

export async function createService(payload: CreateServicePayload): Promise<Service | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Service | null>(response.data) ?? null;
}

export async function updateService(
  id: number | string,
  payload: Partial<CreateServicePayload>
): Promise<Service | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Service | null>(response.data) ?? null;
}

export async function deleteService(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function fetchServiceProfessionals(
  serviceId: number | string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${serviceId}/professionals`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function syncServiceProfessionals(
  serviceId: number | string,
  payload: { professional_ids?: number[] }
): Promise<unknown> {
  const response = await api.put(`${BASE_PATH}/${serviceId}/professionals`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function fetchServiceMaterials(
  serviceId: number | string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${serviceId}/materials`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function syncServiceMaterials(
  serviceId: number | string,
  payload: unknown
): Promise<unknown> {
  const response = await api.put(`${BASE_PATH}/${serviceId}/materials`, payload);
  return response.data?.data ?? response.data ?? null;
}
