import api from '@/lib/api';
import type { Client } from '@/types';

const BASE_PATH = '/api/public';

export interface CustomerAccount {
  id: number;
  email: string;
}

export interface CustomerSessionResponse {
  account?: CustomerAccount;
  client?: Client;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface CustomerRegisterPayload extends CustomerLoginPayload {
  name: string;
  phone?: string;
}

export interface CustomerBookPayload {
  branch_id: number;
  professional_id: number;
  service_id?: number | null;
  combined_service_id?: number | null;
  start_at: string;
  end_at: string;
  notes?: string | null;
}

export async function registerCustomer(
  businessSlug: string,
  payload: CustomerRegisterPayload
): Promise<CustomerSessionResponse> {
  const response = await api.post(`${BASE_PATH}/${businessSlug}/customer/register`, payload);
  return response.data ?? {};
}

export async function loginCustomer(
  businessSlug: string,
  payload: CustomerLoginPayload
): Promise<CustomerSessionResponse> {
  const response = await api.post(`${BASE_PATH}/${businessSlug}/customer/login`, payload);
  return response.data ?? {};
}

export async function logoutCustomer(businessSlug: string): Promise<void> {
  await api.post(`${BASE_PATH}/${businessSlug}/customer/logout`);
}

export async function fetchCustomerMe(businessSlug: string): Promise<CustomerSessionResponse | null> {
  try {
    const response = await api.get(`${BASE_PATH}/${businessSlug}/customer/me`);
    return response.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchCustomerAppointments(businessSlug: string): Promise<unknown[]> {
  const response = await api.get(`${BASE_PATH}/${businessSlug}/customer/appointments`);
  const raw = response.data?.data ?? response.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function createCustomerBooking(
  businessSlug: string,
  payload: CustomerBookPayload
): Promise<unknown> {
  const response = await api.post(`${BASE_PATH}/${businessSlug}/customer/book`, payload);
  return response.data?.data ?? response.data ?? null;
}

