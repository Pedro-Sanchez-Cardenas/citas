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
import { BusinessBrandingPanel } from '@/components/profile/BusinessBrandingPanel';
import { PageHeader, Alert } from '@/components/ui';

export default function ProfilePage() {
	const router = useRouter();
	const { user, loading: authLoading, setUser } = useAuth();
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
				const branding = (
					data?.business as { branding?: Record<string, string | null> } | undefined
				)?.branding;
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
			const branding = (
				refreshed?.business as { branding?: Record<string, string | null> } | undefined
			)?.branding;
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

			<BusinessBrandingPanel
				brandingLogoUrl={brandingLogoUrl}
				brandingHeroImageUrl={brandingHeroImageUrl}
				brandingLogoFile={brandingLogoFile}
				brandingHeroImageFile={brandingHeroImageFile}
				brandingPrimaryColor={brandingPrimaryColor}
				bookingTitle={bookingTitle}
				bookingSubtitle={bookingSubtitle}
				brandingSaving={brandingSaving}
				brandingSuccess={brandingSuccess}
				onChangeBrandingLogoFile={setBrandingLogoFile}
				onChangeBrandingHeroImageFile={setBrandingHeroImageFile}
				onChangeBrandingPrimaryColor={setBrandingPrimaryColor}
				onChangeBookingTitle={setBookingTitle}
				onChangeBookingSubtitle={setBookingSubtitle}
				onSubmit={handleSubmitBranding}
			/>
		</>
	);
}
