import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBusinessSetup, updateBusinessBranding } from '@/lib/api/businessSetup';
import { updateProfileRequest } from '@/lib/api/auth';
import type { UpdateProfilePayload } from '@/lib/api/auth';
import type { BusinessSetup } from '@/components/profile/types';
import type { AxiosError } from 'axios';
import { UserProfilePanel } from '@/components/profile/UserProfilePanel';
import { BusinessOnboardingPanel } from '@/components/profile/BusinessOnboardingPanel';
import { Button, Input, PageHeader } from '@/components/ui';

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
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');
  const [brandingHeroImageUrl, setBrandingHeroImageUrl] = useState('');
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState('#14b8a6');
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingSubtitle, setBookingSubtitle] = useState('');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

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
        const branding = (data?.business as { branding?: Record<string, string | null> } | undefined)?.branding;
        setBrandingLogoUrl(String(branding?.logo_url ?? ''));
        setBrandingHeroImageUrl(String(branding?.hero_image_url ?? ''));
        setBrandingPrimaryColor(String(branding?.primary_color ?? '#14b8a6'));
        setBookingTitle(String(branding?.public_booking_title ?? ''));
        setBookingSubtitle(String(branding?.public_booking_subtitle ?? ''));
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

  const handleSubmitBranding = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBrandingSaving(true);
    setBrandingSuccess(false);
    setError('');
    try {
      await updateBusinessBranding({
        logo_url: brandingLogoUrl.trim() || null,
        hero_image_url: brandingHeroImageUrl.trim() || null,
        primary_color: brandingPrimaryColor.trim() || null,
        public_booking_title: bookingTitle.trim() || null,
        public_booking_subtitle: bookingSubtitle.trim() || null,
      });
      setBrandingSuccess(true);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(ax?.response?.data?.message ?? 'No se pudo actualizar el branding.');
    } finally {
      setBrandingSaving(false);
    }
  };

  if (!authLoading && !user) return null;

  const isLoading = authLoading || loadingSetup;

  return (
    <>
      <PageHeader
        title="Perfil y configuración"
        subtitle="Actualiza tu información de usuario y revisa el progreso del onboarding de tu negocio."
      />

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

      <section className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5">
        <h2 className="text-base font-semibold text-slate-100">
          Branding del portal público de reservas
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Configura el logo y los textos que se muestran en el portal público de reservas para login,
          registro y agendado.
        </p>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmitBranding}>
          <Input
            label="URL del logo"
            id="branding-logo-url"
            value={brandingLogoUrl}
            onChange={(e) => setBrandingLogoUrl(e.target.value)}
            placeholder="https://tu-dominio.com/logo.png"
            hint="Usa una URL pública (PNG/SVG recomendado)."
          />
          <Input
            label="URL de imagen hero/fondo"
            id="branding-hero-url"
            value={brandingHeroImageUrl}
            onChange={(e) => setBrandingHeroImageUrl(e.target.value)}
            placeholder="https://tu-dominio.com/hero.jpg"
            hint="Opcional: fondo visual del portal de reservas."
          />
          <Input
            label="Color primario"
            id="branding-primary-color"
            type="text"
            value={brandingPrimaryColor}
            onChange={(e) => setBrandingPrimaryColor(e.target.value)}
            placeholder="#14b8a6"
            hint="Formato HEX, por ejemplo #14b8a6"
          />
          <Input
            label="Título público"
            id="branding-booking-title"
            value={bookingTitle}
            onChange={(e) => setBookingTitle(e.target.value)}
            placeholder="Reserva tu próxima cita"
          />
          <div className="md:col-span-2">
            <Input
              label="Subtítulo público"
              id="branding-booking-subtitle"
              value={bookingSubtitle}
              onChange={(e) => setBookingSubtitle(e.target.value)}
              placeholder="Inicia sesión para reservar con tu salón"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" size="sm" disabled={brandingSaving}>
              {brandingSaving ? 'Guardando...' : 'Guardar branding'}
            </Button>
            {brandingSuccess && <span className="text-xs text-emerald-300">Cambios guardados</span>}
          </div>
        </form>
      </section>
    </>
  );
}
