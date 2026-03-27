import type { FormEvent } from 'react';

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface LoginFormProps {
  brandName: string;
  error?: string;
  values: LoginFormValues;
  onChange: (next: LoginFormValues) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoRegister: () => void;
  submitLabel?: string;
}

export default function LoginForm({
  brandName,
  error,
  values,
  onChange,
  onSubmit,
  onGoRegister,
  submitLabel = 'Entrar',
}: LoginFormProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-50">{brandName}</h1>
      <p className="mt-1 text-sm text-slate-400">Inicia sesión para agendar tu cita.</p>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          type="email"
          placeholder="correo@ejemplo.com"
          value={values.email}
          onChange={(e) => onChange({ ...values, email: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          type="password"
          placeholder="********"
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
        onClick={onGoRegister}
        type="button"
      >
        Crear cuenta
      </button>
    </div>
  );
}

