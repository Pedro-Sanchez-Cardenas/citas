import type { FormEvent } from 'react';

export interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterFormProps {
  brandName: string;
  error?: string;
  values: RegisterFormValues;
  onChange: (next: RegisterFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoLogin: () => void;
  submitLabel?: string;
}

export default function RegisterForm({
  brandName,
  error,
  values,
  onChange,
  onSubmit,
  onGoLogin,
  submitLabel = 'Crear cuenta',
}: RegisterFormProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-50">{brandName}</h1>
      <p className="mt-1 text-sm text-slate-400">Crea tu cuenta para reservar citas.</p>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Nombre completo"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          type="email"
          placeholder="correo@ejemplo.com"
          value={values.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Teléfono (opcional)"
          value={values.phone}
          onChange={(e) => onChange({ ...values, phone: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={values.password}
          onChange={(e) => onChange({ ...values, password: e.target.value })}
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-slate-950"
        >
          {submitLabel}
        </button>
      </form>

      <button
        className="mt-3 text-sm text-teal-300 underline"
        onClick={onGoLogin}
        type="button"
      >
        Ya tengo cuenta
      </button>
    </div>
  );
}

