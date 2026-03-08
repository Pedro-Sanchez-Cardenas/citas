import api from '@/lib/api';
import type { Branch } from '@/types';

const BASE_PATH = '/api/branches';

export async function fetchBranches(params: Record<string, unknown> = {}): Promise<Branch[]> {
  const response = await api.get(BASE_PATH, { params });
  const data = response.data;
  const raw = data?.data ?? (Array.isArray(data) ? data : []);
  return Array.isArray(raw) ? raw : [];
}
