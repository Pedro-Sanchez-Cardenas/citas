import type { FormEvent } from 'react';
import { Button, Input, ColorField, ImageUploadField } from '@/components/ui';

export interface BusinessBrandingPanelProps {
	brandingLogoUrl: string;
	brandingHeroImageUrl: string;
	brandingLogoFile: File | null;
	brandingHeroImageFile: File | null;
	brandingPrimaryColor: string;
	bookingTitle: string;
	bookingSubtitle: string;
	brandingSaving: boolean;
	brandingSuccess: boolean;
	onChangeBrandingLogoFile: (file: File | null) => void;
	onChangeBrandingHeroImageFile: (file: File | null) => void;
	onChangeBrandingPrimaryColor: (value: string) => void;
	onChangeBookingTitle: (value: string) => void;
	onChangeBookingSubtitle: (value: string) => void;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function BusinessBrandingPanel({
	brandingLogoUrl,
	brandingHeroImageUrl,
	brandingLogoFile,
	brandingHeroImageFile,
	brandingPrimaryColor,
	bookingTitle,
	bookingSubtitle,
	brandingSaving,
	brandingSuccess,
	onChangeBrandingLogoFile,
	onChangeBrandingHeroImageFile,
	onChangeBrandingPrimaryColor,
	onChangeBookingTitle,
	onChangeBookingSubtitle,
	onSubmit,
}: BusinessBrandingPanelProps) {
	return (
		<section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-(--shadow-modal) backdrop-blur-2xl sm:p-6">
			<h2 className="text-base font-semibold tracking-tight text-slate-50">
				Branding del portal público de reservas
			</h2>
			<p className="mt-1 text-sm leading-relaxed text-slate-400">
				Configura el logo y los textos que se muestran en el portal público de reservas para
				login, registro y agendado.
			</p>
			<form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
				<ImageUploadField
					id="branding-logo-file"
					label="Logo"
					value={brandingLogoFile}
					onChange={onChangeBrandingLogoFile}
					accept="image/png,image/jpeg,image/webp,image/svg+xml"
					existingUrl={brandingLogoUrl.trim() || null}
					aspect="wide"
					hint="PNG, JPG, WEBP o SVG. Si no eliges archivo, se mantiene el logo actual."
					emptyDescription="Arrastra el logo o haz clic para elegir."
				/>
				<ImageUploadField
					id="branding-hero-file"
					label="Imagen hero/fondo"
					value={brandingHeroImageFile}
					onChange={onChangeBrandingHeroImageFile}
					accept="image/png,image/jpeg,image/webp"
					existingUrl={brandingHeroImageUrl.trim() || null}
					aspect="wide"
					hint="Opcional. Si no eliges archivo, se mantiene la imagen actual del portal."
					emptyDescription="Arrastra una imagen amplia o haz clic para elegir."
				/>
				<ColorField
					label="Color primario"
					id="branding-primary-color"
					value={brandingPrimaryColor}
					onChange={onChangeBrandingPrimaryColor}
					hint="Usa el selector. Se aplica al portal público de reservas."
				/>
				<Input
					label="Título público"
					id="branding-booking-title"
					value={bookingTitle}
					onChange={(e) => onChangeBookingTitle(e.target.value)}
					placeholder="Reserva tu próxima cita"
				/>
				<div className="md:col-span-2">
					<Input
						label="Subtítulo público"
						id="branding-booking-subtitle"
						value={bookingSubtitle}
						onChange={(e) => onChangeBookingSubtitle(e.target.value)}
						placeholder="Inicia sesión para reservar con tu salón"
					/>
				</div>
				<div className="form-divider md:col-span-2 flex items-center gap-2">
					<Button type="submit" size="sm" disabled={brandingSaving}>
						{brandingSaving ? 'Guardando...' : 'Guardar branding'}
					</Button>
					{brandingSuccess && (
						<span className="text-xs text-emerald-300">Cambios guardados</span>
					)}
				</div>
			</form>
		</section>
	);
}
