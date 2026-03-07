import api from '@/lib/api';

/**
 * Lista de planes y addons disponibles (catálogo).
 */
export async function fetchBillingPlans() {
  const response = await api.get('/api/billing/plans');
  return response.data;
}

/**
 * Estado de suscripción del negocio del usuario actual.
 */
export async function fetchBillingStatus() {
  const response = await api.get('/api/billing/status');
  return response.data;
}

/**
 * Crear sesión de Checkout; devuelve { checkout_url }. Redirigir al usuario a checkout_url.
 */
export async function createCheckout({ plan, success_url, cancel_url, addons = [] }) {
  const response = await api.post('/api/billing/checkout', {
    plan,
    success_url,
    cancel_url,
    addons,
  });
  return response.data;
}

/**
 * URL del portal de facturación de Stripe (gestionar pago, facturas, cancelar).
 */
export async function createBillingPortalSession(return_url) {
  const response = await api.post('/api/billing/portal', { return_url });
  return response.data;
}

/**
 * Añadir addon a la suscripción actual.
 */
export async function addAddon(addonSlug) {
  const response = await api.post(`/api/billing/addons/${encodeURIComponent(addonSlug)}`);
  return response.data;
}

/**
 * Quitar addon de la suscripción.
 */
export async function removeAddon(addonSlug) {
  const response = await api.delete(`/api/billing/addons/${encodeURIComponent(addonSlug)}`);
  return response.data;
}

/**
 * Establecer cantidad de usuarios extra (slots adicionales).
 */
export async function setExtraUsers(quantity) {
  const response = await api.put('/api/billing/extra-users', { quantity: Number(quantity) });
  return response.data;
}
