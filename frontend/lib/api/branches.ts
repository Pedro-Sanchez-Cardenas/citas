import api from '@/lib/api';
import type { Branch } from '@/types';

const BASE_PATH = '/api/branches';

function unwrap<T>(data: unknown): T {
  const d = data as { data?: T };
  return d?.data ?? (data as T);
}

export async function fetchBranches(
  params: Record<string, unknown> = {}
): Promise<Branch[]> {
  const response = await api.get(BASE_PATH, { params });
  const data = response.data;
  const raw = data?.data ?? (Array.isArray(data) ? data : []);
  return Array.isArray(raw) ? raw : [];
}

export interface BranchPayload {
  name: string;
  code: string;
  timezone?: string;
  address_line_1?: string | null;
  city?: string | null;
  country?: string | null;
}

export async function createBranch(payload: BranchPayload): Promise<Branch | null> {
  const response = await api.post(BASE_PATH, payload);
  return unwrap<Branch | null>(response.data) ?? null;
}

export async function updateBranch(
  id: number | string,
  payload: Partial<BranchPayload>
): Promise<Branch | null> {
  const response = await api.put(`${BASE_PATH}/${id}`, payload);
  return unwrap<Branch | null>(response.data) ?? null;
}

export async function deleteBranch(id: number | string): Promise<unknown> {
  const response = await api.delete(`${BASE_PATH}/${id}`);
  return response.data ?? null;
}

