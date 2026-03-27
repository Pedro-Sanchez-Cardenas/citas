import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBillingPlans,
  fetchBillingStatus,
  createCheckout,
  createBillingPortalSession,
  addAddon,
  removeAddon,
  setExtraUsers,
} from '@/lib/api/billing';
import { formatDate } from '@/lib/format';
import { Button, Input, PageHeader, Alert, PageLoading, EmptyState } from '@/components/ui';
import type { BillingPlan, BillingAddon, BillingStatus, PlansData } from '@/components/billing/types';
import type { AxiosError } from 'axios';

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [plansData, setPlansData] = useState<PlansData>({ plans: {}, addons: {} });
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [addonLoading, setAddonLoading] = useState<string | null>(null);
  const [extraUsersQuantity, setExtraUsersQuantity] = useState(0);
  const [extraUsersSaving, setExtraUsersSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [plansRes, statusRes] = await Promise.all([
        fetchBillingPlans(),
        fetchBillingStatus(),
      ]);
      const plansRaw = plansRes as { plans?: Record<string, BillingPlan>; addons?: Record<string, BillingAddon> };
      setPlansData({
        plans: plansRaw.plans ?? {},
        addons: plansRaw.addons ?? {},
      });
      const st = statusRes as BillingStatus;
      setStatus(st);
      setExtraUsersQuantity(st?.extra_users_quantity ?? 0);
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo cargar la información de facturación.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (!user) return;
    loadData();
  }, [user, authLoading, router, loadData]);

  useEffect(() => {
    const { success, checkout } = router.query;
    if (success === '1' || checkout === 'success') {
      setSuccessMessage('Suscripción activada correctamente.');
      loadData();
      router.replace('/billing', undefined, { shallow: true });
    }
    if (checkout === 'cancelled') {
      setSuccessMessage('');
    }
  }, [router.query, router, loadData]);

  const handleCheckout = async (planSlug: string, addonSlugs: string[] = []) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${base}/billing?success=1`;
    const cancelUrl = `${base}/billing?checkout=cancelled`;
    setCheckoutLoading(planSlug);
    setError('');
    try {
      const res = await createCheckout({
        plan: planSlug,
        success_url: successUrl,
        cancel_url: cancelUrl,
        addons: addonSlugs,
      }) as { checkout_url?: string };
      if (res?.checkout_url) window.location.href = res.checkout_url;
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo iniciar el checkout.');
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/billing` : '/billing';
    setPortalLoading(true);
    setError('');
    try {
      const res = await createBillingPortalSession(returnUrl) as { portal_url?: string };
      if (res?.portal_url) window.location.href = res.portal_url;
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo abrir el portal de facturación.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleToggleAddon = async (addonSlug: string, currentlyActive: boolean) => {
    setAddonLoading(addonSlug);
    setError('');
    try {
      if (currentlyActive) {
        await removeAddon(addonSlug);
        setStatus((prev) => prev ? {
          ...prev,
          addons: (prev.addons ?? []).filter((s) => s !== addonSlug),
        } : null);
      } else {
        const res = await addAddon(addonSlug) as { status?: BillingStatus };
        if (res?.status) setStatus(res.status);
        else setStatus((prev) => prev ? {
          ...prev,
          addons: [...(prev.addons ?? []), addonSlug],
        } : null);
      }
      await loadData();
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo actualizar el addon.');
    } finally {
      setAddonLoading(null);
    }
  };

  const handleSaveExtraUsers = async () => {
    setExtraUsersSaving(true);
    setError('');
    try {
      const res = await setExtraUsers(extraUsersQuantity) as { status?: BillingStatus };
      if (res?.status) setStatus(res.status);
      await loadData();
    } catch (e) {
      const ax = e as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo actualizar la cantidad de usuarios extra.');
    } finally {
      setExtraUsersSaving(false);
    }
  };

  if (!authLoading && !user) return null;

  const plans = plansData.plans;
  const addons = plansData.addons;
  const planEntries = Object.entries(plans);
  const addonEntries = Object.entries(addons);

  return (
    <>
      <PageHeader
        title="Facturación y suscripción"
        subtitle="Gestiona tu plan, addons y usuarios adicionales de tu negocio."
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {successMessage && (
        <div className="mb-4">
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

      {loading && (
        <PageLoading label="Cargando facturación..." />
      )}

      {!loading && (
        <div className="space-y-6">
          <section className="surface-panel p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Tu plan actual
            </h2>
            {status?.subscribed || status?.on_trial ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                      status.on_trial
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {status.on_trial ? 'Período de prueba' : 'Activo'}
                  </span>
                  {status.plan && (
                    <span className="text-sm font-medium text-slate-200">
                      Plan {status.plan.name}
                    </span>
                  )}
                  {status.trial_ends_at && (
                    <span className="text-xs text-slate-400">
                      Trial hasta {formatDate(status.trial_ends_at)}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Usuarios
                    </p>
                    <p className="text-slate-200">
                      {status.current_users_count ?? 0} / {status.max_users ?? 0} (incl. {status.plan?.included_users ?? 0} en plan
                      {(status.extra_users_quantity ?? 0) > 0 ? ` + ${status.extra_users_quantity} extra` : ''})
                    </p>
                  </div>
                  {status.addons && status.addons.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        Addons
                      </p>
                      <p className="text-slate-200">
                        {status.addons.map((s) => addons[s]?.name || s).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={handlePortal}
                    disabled={portalLoading || !status?.subscribed}
                  >
                    {portalLoading ? 'Abriendo...' : 'Gestionar facturación (Stripe)'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Aún no tienes una suscripción activa. Elige un plan más abajo.
                </p>
              </div>
            )}
          </section>

          {planEntries.length > 0 && (
            <section className="surface-panel p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Planes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {planEntries.map(([slug, plan]) => {
                  const isCurrent = status?.plan?.slug === slug;
                  return (
                    <div
                      key={slug}
                      className={`rounded-xl border p-4 ${
                        isCurrent
                          ? 'border-teal-500/50 bg-teal-500/10'
                          : 'border-white/8 bg-slate-900/45'
                      }`}
                    >
                      <h3 className="font-semibold text-slate-100">{plan.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {plan.included_users ?? 0} usuario(s) incluido(s)
                      </p>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-slate-300">
                          {plan.features.slice(0, 4).map((f, i) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-4">
                        <Button
                          variant={isCurrent ? 'subtle' : 'primary'}
                          size="sm"
                          disabled={isCurrent || checkoutLoading !== null}
                          onClick={() => handleCheckout(slug)}
                        >
                          {checkoutLoading === slug
                            ? 'Redirigiendo...'
                            : isCurrent
                              ? 'Plan actual'
                              : 'Contratar'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {addonEntries.length > 0 && (status?.subscribed || status?.on_trial) && (
            <section className="surface-panel p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Addons
              </h2>
              <p className="mb-4 text-sm text-slate-400">
                Añade o quita complementos de tu suscripción.
              </p>
              <div className="space-y-2">
                {addonEntries.map(([slug, addon]) => {
                  const active = (status?.addons ?? []).includes(slug);
                  const busy = addonLoading === slug;
                  return (
                    <div
                      key={slug}
                      className="surface-list-row flex items-center justify-between gap-3 px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-100">{addon.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {addon.type === 'recurring' ? 'Recurrente' : 'Pago único'}
                        </p>
                      </div>
                      <Button
                        variant={active ? 'outline' : 'subtle'}
                        size="sm"
                        disabled={busy}
                        onClick={() => handleToggleAddon(slug, active)}
                      >
                        {busy ? '...' : active ? 'Quitar' : 'Añadir'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(status?.subscribed || status?.on_trial) && status?.plan && (
            <section className="surface-panel p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Usuarios extra
              </h2>
              <p className="mb-4 text-sm text-slate-400">
                Tu plan incluye {status.plan.included_users} usuario(s). Añade slots adicionales si
                necesitas más.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <Input
                    label="Cantidad"
                    type="number"
                    min={0}
                    max={999}
                    value={extraUsersQuantity}
                    onChange={(e) => setExtraUsersQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={extraUsersSaving}
                  onClick={handleSaveExtraUsers}
                >
                  {extraUsersSaving ? 'Guardando...' : 'Actualizar'}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Usuarios actuales: {status.current_users_count ?? 0}. Máximo permitido con esta
                configuración: {status.max_users ?? 0}.
              </p>
            </section>
          )}

          {!status?.subscribed && !status?.on_trial && planEntries.length === 0 && (
            <EmptyState
              icon="💳"
              title="No hay planes disponibles"
              description="No encontramos planes de suscripción para mostrar en este momento."
            />
          )}
        </div>
      )}
    </>
  );
}
