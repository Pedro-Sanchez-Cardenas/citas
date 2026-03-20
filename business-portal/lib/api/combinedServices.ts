import api from '@/lib/api';

const BASE_PATH = '/api/combined-services';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchCombinedServices(
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchCombinedService(id: number | string): Promise<unknown | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<unknown | null>(response.data) ?? null;
}

export async function createCombinedService(
  payload: Record<string, unknown>
): Promise<unknown | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<unknown | null>(response.data) ?? null;
}

export async function updateCombinedService(
  id: number | string,
  payload: Record<string, unknown>
): Promise<unknown | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<unknown | null>(response.data) ?? null;
}

export async function deleteCombinedService(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}
