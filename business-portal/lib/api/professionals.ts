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
  branch_id?: number | null;
  create_worker_user?: boolean;
  update_worker_credentials?: boolean;
  worker_password?: string;
  [key: string]: unknown;
}

const FORM_KEYS = [
  'branch_id',
  'name',
  'email',
  'phone',
  'color',
  'commission_rate',
  'base_salary_cents',
  'is_active',
  'create_worker_user',
  'update_worker_credentials',
  'worker_password',
] as const;

function buildProfessionalFormData(
  payload: CreateProfessionalPayload | Partial<CreateProfessionalPayload>,
  photo?: File | null
): FormData | null {
  if (!photo) return null;
  const form = new FormData();
  FORM_KEYS.forEach((key) => {
    const v = payload[key];
    if (v === undefined) return;
    if (v === null) {
      form.append(key, '');
      return;
    }
    if (key === 'branch_id' || key === 'commission_rate' || key === 'base_salary_cents') {
      form.append(key, String(v));
      return;
    }
    if (key === 'is_active') {
      form.append(key, v ? '1' : '0');
      return;
    }
    if (key === 'create_worker_user') {
      form.append(key, v ? '1' : '0');
      return;
    }
    if (key === 'update_worker_credentials') {
      form.append(key, v ? '1' : '0');
      return;
    }
    form.append(key, String(v));
  });
  form.append('photo', photo);
  return form;
}

export async function createProfessional(
  payload: CreateProfessionalPayload,
  photo?: File | null
): Promise<Professional | null> {
  const form = buildProfessionalFormData(payload, photo);
  if (form) {
    const response = await api.post(BASE_PATH, form);
    return unwrap<Professional | null>(response.data) ?? null;
  }
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Professional | null>(response.data) ?? null;
}

export async function updateProfessional(
  id: number | string,
  payload: Partial<CreateProfessionalPayload>,
  photo?: File | null
): Promise<Professional | null> {
  const form = buildProfessionalFormData(payload, photo);
  if (form) {
    form.append('_method', 'PUT');
    const response = await api.post(`${BASE_PATH}/${id}`, form);
    return unwrap<Professional | null>(response.data) ?? null;
  }
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Professional | null>(response.data) ?? null;
}

export async function deleteProfessional(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}
