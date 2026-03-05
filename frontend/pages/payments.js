import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPayments } from '@/lib/api/payments';
import { Button, Input, Select, Table } from '@/components/ui';

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(amount, currency = 'USD') {
  if (amount == null) return '—';
  const symbol = currency === 'USD' ? '$' : '$';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadPayments() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPayments();
        if (!cancelled) {
          setPayments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los pagos.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((pay) => {
      if (methodFilter && pay.method !== methodFilter) return false;
      if (!q) return true;
      const clientName = String(pay.client_name ?? '').toLowerCase();
      const reference = String(pay.reference ?? '').toLowerCase();
      return clientName.includes(q) || reference.includes(q);
    });
  }, [payments, search, methodFilter]);

  const isLoading = authLoading || loading;

  const methods = useMemo(
    () =>
      Array.from(
        new Set(
          payments
            .map((p) => p.method)
            .filter(Boolean)
        )
      ),
    [payments]
  );

  if (!authLoading && !user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Pagos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Consulta el historial de pagos registrados en el sistema.
          </p>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o referencia..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">Todos los métodos</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando pagos...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            💳
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no hay pagos registrados
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Cuando registres pagos asociados a citas o ventas, aparecerán aquí.
          </p>
        </div>
      ) : (
        <Table
          columns={[
            { key: 'date', header: 'Fecha' },
            { key: 'client', header: 'Cliente' },
            { key: 'method', header: 'Método' },
            { key: 'amount', header: 'Monto' },
            { key: 'reference', header: 'Referencia' },
          ]}
          items={filteredPayments}
          getItemKey={(pay) => pay.id}
          renderCell={(pay, key) => {
            if (key === 'date') {
              return (
                <span className="text-xs text-slate-400">
                  {formatDate(pay.paid_at || pay.created_at)}
                </span>
              );
            }

            if (key === 'client') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {pay.client_name || '—'}
                </span>
              );
            }

            if (key === 'method') {
              return (
                <span className="text-xs text-slate-400">
                  {pay.method || '—'}
                </span>
              );
            }

            if (key === 'amount') {
              return (
                <span className="text-xs text-slate-400">
                  {formatMoney(pay.amount, pay.currency)}
                </span>
              );
            }

            if (key === 'reference') {
              return (
                <span className="text-xs text-slate-400">
                  {pay.reference || '—'}
                </span>
              );
            }

            return null;
          }}
        />
      )}
    </DashboardLayout>
  );
}

