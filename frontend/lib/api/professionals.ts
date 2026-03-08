import api from '@/lib/api';
import type { Professional } from '@/types';

const BASE_PATH = '/api/professionals';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchProfessionals(params: Record<string, unknown> = {}): Promise<Professional[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchProfessional(id: number | string): Promise<Professional | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<Professional | null>(response.data) ?? null;
}

export interface CreateProfessionalPayload {
  name: string;
  [key: string]: unknown;
}

export async function createProfessional(payload: CreateProfessionalPayload): Promise<Professional | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Professional | null>(response.data) ?? null;
}

export async function updateProfessional(
  id: number | string,
  payload: Partial<CreateProfessionalPayload>
): Promise<Professional | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Professional | null>(response.data) ?? null;
}

export async function deleteProfessional(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}
