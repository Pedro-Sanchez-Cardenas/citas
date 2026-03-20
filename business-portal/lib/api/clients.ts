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
  notes?: string | null;
  allergies?: string | null;
  [key: string]: unknown;
}

function buildClientFormData(payload: CreateClientPayload | Partial<CreateClientPayload>, photo?: File | null): FormData | null {
  if (!photo) return null;
  const form = new FormData();
  const keys = ['name', 'email', 'phone', 'birthday', 'gender', 'notes', 'allergies'] as const;
  keys.forEach((key) => {
    const v = payload[key];
    if (v !== undefined && v !== null) form.append(key, v === '' ? '' : String(v));
  });
  form.append('photo', photo);
  return form;
}

export async function createClient(
  payload: CreateClientPayload,
  photo?: File | null
): Promise<Client | null> {
  const form = buildClientFormData(payload, photo);
  if (form) {
    const response = await api.post(BASE_PATH, form);
    return unwrap<Client | null>(response.data) ?? null;
  }
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Client | null>(response.data) ?? null;
}

export async function updateClient(
  id: number | string,
  payload: Partial<CreateClientPayload>,
  photo?: File | null
): Promise<Client | null> {
  const form = buildClientFormData(payload, photo);
  if (form) {
    // PHP no rellena $_FILES en PUT; usar POST + _method=PUT para que Laravel enrute a update y el archivo llegue
    form.append('_method', 'PUT');
    const response = await api.post(`${BASE_PATH}/${id}`, form);
    return unwrap<Client | null>(response.data) ?? null;
  }
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
