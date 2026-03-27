import Link from 'next/link';
import type { FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import type { User } from '@/types';

export interface UserProfilePanelProps {
  user: User | null;
  profileName: string;
  profileEmail: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
  profileSaving: boolean;
  profileSuccess: boolean;
  onChangeProfileName: (value: string) => void;
  onChangeProfileEmail: (value: string) => void;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeNewPasswordConfirm: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function UserProfilePanel({
  user,
  profileName,
  profileEmail,
  currentPassword,
  newPassword,
  newPasswordConfirm,
  profileSaving,
  profileSuccess,
  onChangeProfileName,
  onChangeProfileEmail,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeNewPasswordConfirm,
  onSubmit,
}: UserProfilePanelProps) {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.8)] lg:col-span-1">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-500 text-lg font-semibold text-slate-950">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-50">
            {user?.name ?? 'Usuario'}
          </p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          {user?.roles && (
            <span className="items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden />
              {user?.roles[0].replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 space-y-3 text-xs text-slate-300">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Negocio
          </p>
          <p className="mt-1 text-sm">
            {(user as { business?: { name?: string } })?.business?.name ??
              'Sin negocio asignado'}
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/billing"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              Editar datos del negocio →
            </Link>
            <span className="text-slate-600">·</span>
            <Link
              href="/branches"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              Gestionar sucursales →
            </Link>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          label="Nombre"
          id="profile-name"
          value={profileName}
          onChange={(e) => onChangeProfileName(e.target.value)}
          placeholder="Tu nombre"
        />
        <Input
          label="Correo electrónico"
          id="profile-email"
          type="email"
          value={profileEmail}
          onChange={(e) => onChangeProfileEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
        />
        <p className="text-[11px] text-slate-500">
          Para cambiar la contraseña, rellena los tres campos siguientes.
        </p>
        <Input
          label="Contraseña actual"
          id="profile-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => onChangeCurrentPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Input
          label="Nueva contraseña"
          id="profile-password"
          type="password"
          value={newPassword}
          onChange={(e) => onChangeNewPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <Input
          label="Confirmar nueva contraseña"
          id="profile-password-confirm"
          type="password"
          value={newPasswordConfirm}
          onChange={(e) => onChangeNewPasswordConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {profileSuccess && (
          <p className="text-xs text-emerald-300">Perfil actualizado correctamente.</p>
        )}
        <Button type="submit" size="sm" disabled={profileSaving}>
          {profileSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </section>
  );
}

