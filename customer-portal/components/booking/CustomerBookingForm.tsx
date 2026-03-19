import type { FormEvent } from 'react';

interface BookingBranch {
  id: number;
  name: string;
}

interface BookingService {
  id: number;
  name: string;
  duration_minutes?: number;
}

interface BookingProfessional {
  id: number;
  name: string;
  branch_id?: number;
}

export interface CustomerBookingFormValues {
  branchId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
}

export interface CustomerBookingFormProps {
  branches: BookingBranch[];
  services: BookingService[];
  professionals: BookingProfessional[];
  values: CustomerBookingFormValues;
  message?: string;
  onChange: (next: CustomerBookingFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function CustomerBookingForm({
  branches,
  services,
  professionals,
  values,
  message,
  onChange,
  onSubmit,
}: CustomerBookingFormProps) {
  const professionalsForBranch = professionals.filter(
    (p) => !values.branchId || String(p.branch_id) === values.branchId
  );

  return (
    <>
      {message && <p className="mt-2 text-sm text-emerald-300">{message}</p>}
      <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={values.branchId}
          onChange={(e) => onChange({ ...values, branchId: e.target.value, serviceId: '' })}
          required
        >
          <option value="">Sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={values.serviceId}
          onChange={(e) => onChange({ ...values, serviceId: e.target.value })}
        >
          <option value="">Servicio (opcional)</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={values.professionalId}
          onChange={(e) => onChange({ ...values, professionalId: e.target.value })}
          required
        >
          <option value="">Profesional</option>
          {professionalsForBranch.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          type="date"
          value={values.date}
          onChange={(e) => onChange({ ...values, date: e.target.value })}
          required
        />

        <input
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm md:col-span-2"
          type="time"
          value={values.time}
          onChange={(e) => onChange({ ...values, time: e.target.value })}
          required
        />

        <button
          className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-slate-950 md:col-span-2"
          type="submit"
        >
          Confirmar cita
        </button>
      </form>
    </>
  );
}

