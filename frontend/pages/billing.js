import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
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
import { Button, Input } from '@/components/ui';

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [plansData, setPlansData] = useState({ plans: {}, addons: {} });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [addonLoading, setAddonLoading] = useState(null);
  const [extraUsersQuantity, setExtraUsersQuantity] = useState(0);
  const [extraUsersSaving, setExtraUsersSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [plansRes, statusRes] = await Promise.all([
        fetchBillingPlans(),
        fetchBillingStatus(),
      ]);
      setPlansData({ plans: plansRes.plans || {}, addons: plansRes.addons || {} });
      setStatus(statusRes);
      setExtraUsersQuantity(statusRes?.extra_users_quantity ?? 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo cargar la información de facturación.');
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

  const handleCheckout = async (planSlug, addonSlugs = []) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${base}/billing?success=1`;
    const cancelUrl = `${base}/billing?checkout=cancelled`;
    setCheckoutLoading(planSlug);
    setError('');
    try {
      const { checkout_url } = await createCheckout({
        plan: planSlug,
        success_url: successUrl,
        cancel_url: cancelUrl,
        addons: addonSlugs,
      });
      if (checkout_url) window.location.href = checkout_url;
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo iniciar el checkout.');
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/billing` : '/billing';
    setPortalLoading(true);
    setError('');
    try {
      const { portal_url } = await createBillingPortalSession(returnUrl);
      if (portal_url) window.location.href = portal_url;
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo abrir el portal de facturación.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleToggleAddon = async (addonSlug, currentlyActive) => {
    setAddonLoading(addonSlug);
    setError('');
    try {
      if (currentlyActive) {
        await removeAddon(addonSlug);
        setStatus((prev) => ({
          ...prev,
          addons: (prev?.addons || []).filter((s) => s !== addonSlug),
        }));
      } else {
        const res = await addAddon(addonSlug);
        if (res?.status) setStatus(res.status);
        else setStatus((prev) => ({
          ...prev,
          addons: [...(prev?.addons || []), addonSlug],
        }));
      }
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo actualizar el addon.');
    } finally {
      setAddonLoading(null);
    }
  };

  const handleSaveExtraUsers = async () => {
    setExtraUsersSaving(true);
    setError('');
    try {
      const res = await setExtraUsers(extraUsersQuantity);
      if (res?.status) setStatus(res.status);
      await loadData();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo actualizar la cantidad de usuarios extra.');
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
    <DashboardLayout user={user} onLogout={logout}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Facturación y suscripción
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona tu plan, addons y usuarios adicionales de tu negocio.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-8 text-center text-slate-400">
          Cargando facturación...
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Estado actual */}
          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)]">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              Tu plan actual
            </h2>
            {status?.subscribed || status?.on_trial ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      status.on_trial
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
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
                      Trial hasta {new Date(status.trial_ends_at).toLocaleDateString()}
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
                      {status.extra_users_quantity > 0 ? ` + ${status.extra_users_quantity} extra` : ''})
                    </p>
                  </div>
                  {status.addons?.length > 0 && (
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

          {/* Planes */}
          {planEntries.length > 0 && (
            <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)]">
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
                          ? 'border-teal-500/50 bg-teal-500/5'
                          : 'border-slate-800/80 bg-slate-900/50'
                      }`}
                    >
                      <h3 className="font-semibold text-slate-100">{plan.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {plan.included_users ?? 0} usuario(s) incluido(s)
                      </p>
                      {plan.features?.length > 0 && (
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

          {/* Addons (solo si ya tiene suscripción) */}
          {addonEntries.length > 0 && (status?.subscribed || status?.on_trial) && (
            <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)]">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Addons
              </h2>
              <p className="mb-4 text-sm text-slate-400">
                Añade o quita complementos de tu suscripción.
              </p>
              <div className="space-y-2">
                {addonEntries.map(([slug, addon]) => {
                  const active = (status?.addons || []).includes(slug);
                  const busy = addonLoading === slug;
                  return (
                    <div
                      key={slug}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3.5 py-2.5"
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

          {/* Usuarios extra (solo si tiene suscripción) */}
          {(status?.subscribed || status?.on_trial) && status?.plan && (
            <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)]">
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
        </div>
      )}
    </DashboardLayout>
  );
}
