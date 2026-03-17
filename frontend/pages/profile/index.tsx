import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBusinessSetup } from '@/lib/api/businessSetup';
import { updateProfileRequest } from '@/lib/api/auth';
import type { UpdateProfilePayload } from '@/lib/api/auth';
import type { BusinessSetup } from '@/components/profile/types';
import type { AxiosError } from 'axios';
import { UserProfilePanel } from '@/components/profile/UserProfilePanel';
import { BusinessOnboardingPanel } from '@/components/profile/BusinessOnboardingPanel';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, setUser } = useAuth();
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [error, setError] = useState('');
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (!user) return;

    const load = async () => {
      try {
        const data = (await fetchBusinessSetup()) as BusinessSetup;
        setSetup(data);
      } catch {
        setError('No se pudo cargar el estado de configuración del negocio.');
      } finally {
        setLoadingSetup(false);
      }
    };

    load();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name ?? '');
      setProfileEmail(user.email ?? '');
    }
  }, [user]);

  const handleSubmitProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');
    setProfileSuccess(false);
    try {
      const payload: UpdateProfilePayload = {};
      if (profileName.trim() !== (user?.name ?? '')) payload.name = profileName.trim();
      if (profileEmail.trim() !== (user?.email ?? '')) payload.email = profileEmail.trim();
      if (newPassword.trim()) {
        payload.current_password = currentPassword;
        payload.password = newPassword;
        payload.password_confirmation = newPasswordConfirm;
      }
      if (Object.keys(payload).length === 0) {
        setProfileSaving(false);
        return;
      }
      const updatedUser = await updateProfileRequest(payload);
      setUser(updatedUser);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setProfileSuccess(true);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ?? 'No se pudo actualizar el perfil. Revisa los datos.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (!authLoading && !user) return null;

  const isLoading = authLoading || loadingSetup;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Perfil y configuración
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Actualiza tu información de usuario y revisa el progreso del
            onboarding de tu negocio.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UserProfilePanel
          user={user}
          profileName={profileName}
          profileEmail={profileEmail}
          currentPassword={currentPassword}
          newPassword={newPassword}
          newPasswordConfirm={newPasswordConfirm}
          profileSaving={profileSaving}
          profileSuccess={profileSuccess}
          onChangeProfileName={setProfileName}
          onChangeProfileEmail={setProfileEmail}
          onChangeCurrentPassword={setCurrentPassword}
          onChangeNewPassword={setNewPassword}
          onChangeNewPasswordConfirm={setNewPasswordConfirm}
          onSubmit={handleSubmitProfile}
        />

        <BusinessOnboardingPanel setup={setup} isLoading={isLoading} />
      </div>
    </>
  );
}
