import api from '@/lib/api';

const BASE_PATH = '/api/working-hours';

function unwrap<T>(data: unknown): T {
	const d = data as { data?: T };
	return d?.data ?? (data as T);
}

export interface WorkingHourBlock {
	id: number;
	ids: number[];
	start_time: string;
	end_time: string;
	effective_from: string | null;
	effective_until: string | null;
	is_active: boolean;
}

export interface WorkingHourGroup {
	branch_id: number | null;
	branch_name: string;
	professional_id: number | null;
	professional_name: string;
	weekdays: number[];
	hours: WorkingHourBlock[];
}

export async function fetchWorkingHours(
	params: Record<string, unknown> = {}
): Promise<WorkingHourGroup[]> {
	const response = await api.get(BASE_PATH, { params });
	const raw = response.data?.data ?? response.data ?? [];
	return Array.isArray(raw) ? raw : [];
}

export async function fetchWorkingHour(id: number | string): Promise<WorkingHourBlock | null> {
	const response = await api.get(`${BASE_PATH}/${id}`);
	return unwrap<WorkingHourBlock | null>(response.data) ?? null;
}

export interface CreateWorkingHourPayload {
	branch_id?: number | null;
	professional_id?: number | null;
	weekday?: number[];
	hours?: { start_time?: string; end_time?: string }[];
	effective_from?: string | null;
	effective_until?: string | null;
	is_active?: boolean;
	[key: string]: unknown;
}

export async function createWorkingHour(
	payload: CreateWorkingHourPayload
): Promise<WorkingHourBlock | null> {
	const response = await api.post(BASE_PATH, payload);
	return unwrap<WorkingHourBlock | null>(response.data) ?? null;
}

export async function updateWorkingHour(
	id: number | string,
	payload: Partial<CreateWorkingHourPayload>
): Promise<WorkingHourBlock | null> {
	const response = await api.put(`${BASE_PATH}/${id}`, payload);
	return unwrap<WorkingHourBlock | null>(response.data) ?? null;
}

export async function deleteWorkingHour(id: number | string): Promise<unknown> {
	const response = await api.delete(`${BASE_PATH}/${id}`);
	return response.data ?? null;
}
