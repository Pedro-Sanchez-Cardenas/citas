import api from '@/lib/api';

const BASE_PATH = '/api/working-hours';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export interface WorkingHour {
  id: number;
  professional_id?: number | null;
  weekday?: number;
  start_time?: string;
  end_time?: string;
  effective_from?: string | null;
  effective_until?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
}

export async function fetchWorkingHours(params: Record<string, unknown> = {}): Promise<WorkingHour[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchWorkingHour(id: number | string): Promise<WorkingHour | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<WorkingHour | null>(response.data) ?? null;
}

export interface CreateWorkingHourPayload {
  professional_id?: number | null;
  weekday?: number;
  start_time?: string;
  end_time?: string;
  effective_from?: string | null;
  effective_until?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
}

export async function createWorkingHour(payload: CreateWorkingHourPayload): Promise<WorkingHour | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<WorkingHour | null>(response.data) ?? null;
}

export async function updateWorkingHour(
  id: number | string,
  payload: Partial<CreateWorkingHourPayload>
): Promise<WorkingHour | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<WorkingHour | null>(response.data) ?? null;
}

export async function deleteWorkingHour(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}
