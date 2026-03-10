import api from '@/lib/api';

const BASE_PATH = '/api/blocks';

function unwrap<T>(data: unknown): T {
	const d = data as { data?: T };
	return d?.data ?? (data as T);
}

export interface Block {
	id: number;
	branch_id?: number | null;
	professional_id?: number | null;
	start_at: string;
	end_at: string;
	reason?: string | null;
	type?: string | null;
	[key: string]: unknown;
}

export async function fetchBlocks(params: Record<string, unknown> = {}): Promise<Block[]> {
	const response = await api.get(BASE_PATH, { params });
	const raw = response.data?.data ?? response.data ?? [];
	return Array.isArray(raw) ? raw : [];
}

export async function fetchBlock(id: number | string): Promise<Block | null> {
	const response = await api.get(`${BASE_PATH}/${id}`);
	return unwrap<Block | null>(response.data) ?? null;
}

export interface CreateBlockPayload {
	branch_id?: number | null;
	professional_id?: number | null;
	start_at: string;
	end_at: string;
	reason?: string | null;
	type?: string | null;
}

export async function createBlock(payload: CreateBlockPayload): Promise<Block | null> {
	const response = await api.post(BASE_PATH, payload);
	return unwrap<Block | null>(response.data) ?? null;
}

export async function deleteBlock(id: number | string): Promise<unknown> {
	const response = await api.delete(`${BASE_PATH}/${id}`);
	return response.data ?? null;
}
