import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPayments, createPayment } from '@/lib/api/payments';
import { fetchBranches } from '@/lib/api/branches';
import { fetchAppointments } from '@/lib/api/appointments';
import { fetchClients } from '@/lib/api/clients';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Select, Table, Modal } from '@/components/ui';
import type { Appointment, Client, Branch } from '@/types';

interface AppointmentWithBranch extends Appointment {
  branch_id?: number;
}
import type { AxiosError } from 'axios';

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '—';
  const symbol = currency === 'USD' ? '$' : '$';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];

interface PaymentItem {
  id: number;
  client_name?: string;
  method?: string;
  amount?: number;
  currency?: string;
  paid_at?: string;
  created_at?: string;
  reference?: string;
  [key: string]: unknown;
}

interface PaymentFormPayload {
  branch_id: number;
  appointment_id?: number | null;
  client_id?: number | null;
  method: string;
  amount_cents: number;
  tip_cents?: number | null;
  currency: string;
  status: string;
  provider_payment_id?: string | null;
}

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PaymentFormPayload) => Promise<void>;
  loading: boolean;
  branches: Branch[];
  appointments: AppointmentWithBranch[];
  clients: Client[];
  fieldErrors: FormFieldErrors;
}

function PaymentFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  branches,
  appointments,
  clients,
  fieldErrors,
}: PaymentFormModalProps) {
  const [branchId, setBranchId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [clientId, setClientId] = useState('');
  const [method, setMethod] = useState('efectivo');
  const [amount, setAmount] = useState('');
  const [tip, setTip] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('paid');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (open) {
      setBranchId('');
      setAppointmentId('');
      setClientId('');
      setMethod('efectivo');
      setAmount('');
      setTip('');
      setCurrency('USD');
      setStatus('paid');
      setReference('');
    }
  }, [open]);

  const selectedAppointment = useMemo(
    () => appointments.find((a) => String(a.id) === String(appointmentId)),
    [appointments, appointmentId]
  );
  const effectiveBranchId = selectedAppointment?.branch_id ?? branchId;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amountCents = amount && !Number.isNaN(Number(amount)) ? Math.round(Number(amount) * 100) : 0;
    const tipCents = tip && !Number.isNaN(Number(tip)) ? Math.round(Number(tip) * 100) : 0;
    const payload: PaymentFormPayload = {
      branch_id: Number(effectiveBranchId),
      appointment_id: appointmentId ? Number(appointmentId) : null,
      client_id: clientId ? Number(clientId) : null,
      method,
      amount_cents: amountCents,
      tip_cents: tipCents || null,
      currency: currency || 'USD',
      status,
      provider_payment_id: reference || null,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pago"
      description="Registra un pago asociado a una cita o a un cliente."
      size="lg"
    >
      <form className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Select
          label="Sucursal"
          id="payment-branch"
          value={selectedAppointment ? String(selectedAppointment.branch_id) : branchId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
          required
          disabled={!!selectedAppointment}
          error={fieldErrors.branch_id}
        >
          <option value="">Selecciona sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>

        <Select
          label="Cita (opcional)"
          id="payment-appointment"
          value={appointmentId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            setAppointmentId(e.target.value);
            if (e.target.value) setClientId('');
          }}
          error={fieldErrors.appointment_id}
        >
          <option value="">Sin asociar a cita</option>
          {appointments.slice(0, 100).map((a) => (
            <option key={a.id} value={a.id}>
              {a.client_name} — {a.start_at ? new Date(a.start_at).toLocaleString() : ''}
            </option>
          ))}
        </Select>

        {!appointmentId && (
          <Select
            label="Cliente (opcional)"
            id="payment-client"
            value={clientId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setClientId(e.target.value)}
            error={fieldErrors.client_id}
          >
            <option value="">Sin asociar a cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Método de pago"
          id="payment-method"
          value={method}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)}
          required
          error={fieldErrors.method}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        <Input
          label="Monto"
          id="payment-amount"
          type="number"
          min={0}
          step="0.01"
          required
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="0.00"
          error={fieldErrors.amount_cents}
        />

        <Input
          label="Propina (opcional)"
          id="payment-tip"
          type="number"
          min={0}
          step="0.01"
          value={tip}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTip(e.target.value)}
          placeholder="0.00"
          error={fieldErrors.tip_cents}
        />

        <Select
          label="Estado"
          id="payment-status"
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          error={fieldErrors.status}
        >
          {PAYMENT_STATUS.map((s) => (
            <option key={s} value={s}>
              {s === 'paid' ? 'Pagado' : s === 'pending' ? 'Pendiente' : s === 'failed' ? 'Fallido' : 'Reembolsado'}
            </option>
          ))}
        </Select>

        <Input
          label="Referencia (opcional)"
          id="payment-reference"
          value={reference}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
          placeholder="Número de transacción, folio..."
          error={fieldErrors.provider_payment_id}
        />

        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="subtle" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar pago'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

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
          const raw = (data as { data?: PaymentItem[] })?.data ?? (Array.isArray(data) ? data : []);
          setPayments(Array.isArray(raw) ? (raw as PaymentItem[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los pagos.'
          );
          if (ax?.response?.status === 401) {
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
          setAppointments(Array.isArray(appointmentsData) ? (appointmentsData as AppointmentWithBranch[]) : []);
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
      const created = await createPayment(payload as unknown as Record<string, unknown>);
      setPayments((prev) => [created as PaymentItem, ...(Array.isArray(prev) ? prev : [])]);
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
        new Set(
          payments
            .map((p) => p.method)
            .filter(Boolean) as string[]
        )
      ),
    [payments]
  );

  if (!authLoading && !user) {
    return null;
  }

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
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Pagos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Consulta y registra pagos asociados a citas o clientes.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setFieldErrors({});
            setModalOpen(true);
          }}
          size="md"
        >
          <span className="mr-2 text-base">＋</span>
          Registrar pago
        </Button>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethodFilter(e.target.value)}
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
      )}
    </>
  );
}
