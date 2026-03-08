import api from '@/lib/api';
import type { Client } from '@/types';

const BASE_PATH = '/api/clients';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchClients(params: Record<string, unknown> = {}): Promise<Client[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchClient(id: number | string): Promise<Client | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<Client | null>(response.data) ?? null;
}

export interface CreateClientPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  preferred_stylist?: string | null;
  notes?: string | null;
  allergies?: string | null;
  [key: string]: unknown;
}

export async function createClient(payload: CreateClientPayload): Promise<Client | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Client | null>(response.data) ?? null;
}

export async function updateClient(
  id: number | string,
  payload: Partial<CreateClientPayload>
): Promise<Client | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Client | null>(response.data) ?? null;
}

export async function deleteClient(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function fetchClientHistory(
  clientId: number | string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${clientId}/history`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchClientMedia(
  clientId: number | string,
  params: Record<string, unknown> = {}
): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${clientId}/media`, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function uploadClientMedia(
  clientId: number | string,
  payload: FormData | Record<string, unknown>
): Promise<unknown> {
  const response = await api.post(`${BASE_PATH}/${clientId}/media`, payload);
  return response.data?.data ?? response.data ?? null;
}

export async function deleteClientMedia(mediaId: number | string): Promise<unknown> {
  const response = await api.delete(`/api/client-media/${mediaId}`);
  return response.data ?? null;
}
