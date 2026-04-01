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
import { Button, Input, PageHeader, Alert, PageLoading } from '@/components/ui';

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
  const [brandingLogoFile, setBrandingLogoFile] = useState<File | null>(null);
  const [brandingHeroImageFile, setBrandingHeroImageFile] = useState<File | null>(null);
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
        setBrandingLogoFile(null);
        setBrandingHeroImageFile(null);
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
				primary_color: brandingPrimaryColor.trim() || null,
				public_booking_title: bookingTitle.trim() || null,
				public_booking_subtitle: bookingSubtitle.trim() || null,
        logo_file: brandingLogoFile,
        hero_image_file: brandingHeroImageFile,
			});
      const refreshed = (await fetchBusinessSetup()) as BusinessSetup;
      const branding = (refreshed?.business as { branding?: Record<string, string | null> } | undefined)?.branding;
      setSetup(refreshed);
      setBrandingLogoUrl(String(branding?.logo_url ?? ''));
      setBrandingHeroImageUrl(String(branding?.hero_image_url ?? ''));
      setBrandingLogoFile(null);
      setBrandingHeroImageFile(null);
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
				<div className="mb-4">
					<Alert variant="error">{error}</Alert>
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

			<section className="surface-panel mt-6 p-5 sm:p-6">
				<h2 className="text-base font-semibold tracking-tight text-slate-50">
					Branding del portal público de reservas
				</h2>
				<p className="mt-1 text-sm leading-relaxed text-slate-400">
					Configura el logo y los textos que se muestran en el portal público de reservas para login,
					registro y agendado.
				</p>
				<form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmitBranding}>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400" htmlFor="branding-logo-file">
                  Logo
                </label>
                <input
                  id="branding-logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setBrandingLogoFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/45 px-4 py-2.5 text-sm text-slate-50 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-slate-900/70 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  PNG, JPG, WEBP o SVG. {brandingLogoUrl ? `Actual: ${brandingLogoUrl}` : 'Sin logo cargado.'}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-400" htmlFor="branding-hero-file">
                  Imagen hero/fondo
                </label>
                <input
                  id="branding-hero-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setBrandingHeroImageFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/45 px-4 py-2.5 text-sm text-slate-50 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-slate-900/70 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Opcional. {brandingHeroImageUrl ? `Actual: ${brandingHeroImageUrl}` : 'Sin imagen cargada.'}
                </p>
              </div>
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
					<div className="form-divider md:col-span-2 flex items-center gap-2">
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
