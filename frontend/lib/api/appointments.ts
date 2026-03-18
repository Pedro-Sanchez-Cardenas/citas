import api from '@/lib/api';
import type { Appointment } from '@/types';

const BASE_PATH = '/api/appointments';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchAppointments(params: Record<string, unknown> = {}): Promise<Appointment[]> {
  const response = await api.get(BASE_PATH, { params });
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchAppointment(id: number | string): Promise<Appointment | null> {
  const response = await api.get(`${BASE_PATH}/${id}`);
  return unwrap<Appointment | null>(response.data) ?? null;
}

export interface CreateAppointmentPayload {
  branch_id: number;
  professional_id: number;
  service_id?: number | null;
  client_id?: number | null;
  start_at: string;
  end_at: string;
  status?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Appointment | null>(response.data) ?? null;
}

export async function updateAppointment(
  id: number | string,
  payload: Partial<CreateAppointmentPayload>
): Promise<Appointment | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Appointment | null>(response.data) ?? null;
}

export async function deleteAppointment(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

export async function moveAppointment(
  id: number | string,
  payload: { start_at: string; end_at: string }
): Promise<Appointment | null> {
  const response = await api.patch(`${BASE_PATH}/${id}/move`, payload);
  return unwrap<Appointment | null>(response.data) ?? null;
}
