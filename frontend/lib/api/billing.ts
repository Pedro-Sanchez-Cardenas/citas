import api from '@/lib/api';

export async function fetchBillingPlans(): Promise<unknown> {
  const response = await api.get('/api/billing/plans');
  return response.data;
}

export async function fetchBillingStatus(): Promise<unknown> {
  const response = await api.get('/api/billing/status');
  return response.data;
}

export interface CreateCheckoutParams {
  plan: string;
  success_url: string;
  cancel_url: string;
  addons?: string[];
}

export async function createCheckout(params: CreateCheckoutParams): Promise<unknown> {
  const { plan, success_url, cancel_url, addons = [] } = params;
  const response = await api.post('/api/billing/checkout', {
    plan,
    success_url,
    cancel_url,
    addons,
  });
  return response.data;
}

export async function createBillingPortalSession(return_url: string): Promise<unknown> {
  const response = await api.post('/api/billing/portal', { return_url });
  return response.data;
}

export async function addAddon(addonSlug: string): Promise<unknown> {
  const response = await api.post(`/api/billing/addons/${encodeURIComponent(addonSlug)}`);
  return response.data;
}

export async function removeAddon(addonSlug: string): Promise<unknown> {
  const response = await api.delete(`/api/billing/addons/${encodeURIComponent(addonSlug)}`);
  return response.data;
}

export async function setExtraUsers(quantity: number): Promise<unknown> {
  const response = await api.put('/api/billing/extra-users', { quantity: Number(quantity) });
  return response.data;
}
