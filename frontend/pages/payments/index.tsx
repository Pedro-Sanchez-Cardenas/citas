import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPayments, createPayment } from '@/lib/api/payments';
import { fetchBranches } from '@/lib/api/branches';
import { fetchAppointments } from '@/lib/api/appointments';
import { fetchClients } from '@/lib/api/clients';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate } from '@/lib/format';
import { Button, Input, Select, Table, EmptyState, Alert, PageHeader } from '@/components/ui';
import {
  PaymentFormModal,
  formatMoney,
  type PaymentItem,
  type PaymentFormPayload,
  type AppointmentWithBranch,
} from '@/components/payments';
import type { Branch, Client } from '@/types';
import type { AxiosError } from 'axios';

export default function PaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithBranch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

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
          const raw =
            (data as { data?: PaymentItem[] })?.data ??
            (Array.isArray(data) ? data : []);
          setPayments(Array.isArray(raw) ? (raw as PaymentItem[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudieron cargar los pagos.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPayments();
    return () => { cancelled = true; };
  }, [user, logout]);

  useEffect(() => {
    if (!user || !modalOpen) return;
    let cancelled = false;
    async function loadFormData() {
      try {
        const [branchesData, appointmentsData, clientsData] = await Promise.all([
          fetchBranches(),
          fetchAppointments(),
          fetchClients(),
        ]);
        if (!cancelled) {
          setBranches(Array.isArray(branchesData) ? branchesData : []);
          setAppointments(
            Array.isArray(appointmentsData)
              ? (appointmentsData as AppointmentWithBranch[])
              : []
          );
          setClients(Array.isArray(clientsData) ? clientsData : []);
        }
      } catch {
        if (!cancelled) setError('No se pudieron cargar sucursales, citas o clientes.');
      }
    }
    loadFormData();
    return () => { cancelled = true; };
  }, [user, modalOpen]);

  const handleSubmitPayment = async (payload: PaymentFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const created = await createPayment(
        payload as unknown as Record<string, unknown>
      );
      setPayments((prev) => [
        created as PaymentItem,
        ...(Array.isArray(prev) ? prev : []),
      ]);
      setModalOpen(false);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message || 'No se pudo registrar el pago.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((pay) => {
      if (methodFilter && pay.method !== methodFilter) return false;
      if (!q) return true;
      const clientName = String(pay.client_name ?? '').toLowerCase();
      const ref = String(pay.reference ?? '').toLowerCase();
      return clientName.includes(q) || ref.includes(q);
    });
  }, [payments, search, methodFilter]);

  const isLoading = authLoading || loading;

  const methods = useMemo(
    () =>
      Array.from(
        new Set(payments.map((p) => p.method).filter(Boolean) as string[])
      ),
    [payments]
  );

  if (!authLoading && !user) return null;

  return (
    <>
      <PaymentFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
          }
        }}
        onSubmit={handleSubmitPayment}
        loading={modalLoading}
        branches={branches}
        appointments={appointments}
        clients={clients}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Pagos"
        subtitle="Consulta y registra pagos asociados a citas o clientes."
        action={
          <Button
            type="button"
            onClick={() => {
              setFieldErrors({});
              setModalOpen(true);
            }}
            size="md"
          >
            <span className="mr-2 text-base">+</span>
            Registrar pago
          </Button>
        }
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar pagos">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 max-w-md">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o referencia..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
          <Select
            value={methodFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethodFilter(e.target.value)}
            className="w-full sm:w-auto"
          >
            <option value="">Todos los métodos</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-slate-500">
          {(search.trim() || methodFilter)
            ? `${filteredPayments.length} de ${payments.length} pagos`
            : `${payments.length} pago${payments.length === 1 ? '' : 's'}`}
        </p>
      </section>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/30">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/50 border-t-teal-400" />
            <span className="text-sm">Cargando pagos...</span>
          </div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon="💳"
          title={(search.trim() || methodFilter) ? 'No hay resultados' : 'Aún no hay pagos'}
          description={
            (search.trim() || methodFilter)
              ? 'Prueba con otro filtro o término.'
              : 'Registra pagos asociados a citas o ventas para llevar el control de cobros.'
          }
          action={
            !search.trim() && !methodFilter ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setFieldErrors({});
                  setModalOpen(true);
                }}
              >
                Registrar primer pago
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<PaymentItem>
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
        </div>
      )}
    </>
  );
}
