import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { PaymentFormPayload } from './types';
import type { AppointmentWithBranch } from './types';
import type { Branch, Client } from '@/types';
import { PAYMENT_METHODS, PAYMENT_STATUS } from './utils';

export interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PaymentFormPayload) => Promise<void>;
  loading: boolean;
  branches: Branch[];
  appointments: AppointmentWithBranch[];
  clients: Client[];
  fieldErrors: FormFieldErrors;
}

export function PaymentFormModal({
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
    const amountCents =
      amount && !Number.isNaN(Number(amount)) ? Math.round(Number(amount) * 100) : 0;
    const tipCents =
      tip && !Number.isNaN(Number(tip)) ? Math.round(Number(tip) * 100) : 0;
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
              {a.client_name} — {a.start_at ? formatDateTime(a.start_at) : ''}
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
              {s === 'paid'
                ? 'Pagado'
                : s === 'pending'
                ? 'Pendiente'
                : s === 'failed'
                ? 'Fallido'
                : 'Reembolsado'}
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

        <div className="mt-2 flex items-center justify-end gap-2 md:col-span-2">
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
