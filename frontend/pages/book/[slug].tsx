import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
	fetchPublicServices,
	fetchPublicProfessionals,
} from '@/lib/api/publicBooking';
import {
	createCustomerBooking,
	fetchCustomerAppointments,
	fetchCustomerMe,
	loginCustomer,
	logoutCustomer,
	registerCustomer,
	type CustomerAccount,
} from '@/lib/api/customerPortal';
import { Button, Input, Select, DatePicker } from '@/components/ui';
import type { AxiosError } from 'axios';

interface BranchWithServices {
	id: number;
	name: string;
	services?: { id: number; name: string; duration_minutes?: number }[];
}

interface PublicProfessional {
	id: number;
	name: string;
	branch_id?: number;
	[key: string]: unknown;
}

interface CustomerAppointment {
	id: number;
	start_at?: string;
	status?: string;
	service?: { name?: string };
	combined_service?: { name?: string };
	professional?: { name?: string };
}

export default function PublicBookPage() {
	const router = useRouter();
	const { slug } = router.query as { slug?: string };

	const [branchesWithServices, setBranchesWithServices] = useState<BranchWithServices[]>([]);
	const [professionals, setProfessionals] = useState<PublicProfessional[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [customer, setCustomer] = useState<{ account: CustomerAccount; name: string } | null>(null);
	const [customerHistory, setCustomerHistory] = useState<CustomerAppointment[]>([]);
	const [customerEmail, setCustomerEmail] = useState('');
	const [customerPassword, setCustomerPassword] = useState('');
	const [registerName, setRegisterName] = useState('');
	const [registerPhone, setRegisterPhone] = useState('');

	const [branchId, setBranchId] = useState('');
	const [serviceId, setServiceId] = useState('');
	const [professionalId, setProfessionalId] = useState('');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('09:00');

	const branches = useMemo(
		() => (Array.isArray(branchesWithServices) ? branchesWithServices : []),
		[branchesWithServices]
	);

	const services = useMemo(() => {
		const branch = branches.find((b) => String(b.id) === String(branchId));
		const list = branch?.services ?? [];
		return Array.isArray(list) ? list : [];
	}, [branches, branchId]);

	const selectedService = useMemo(
		() => services.find((s) => String(s.id) === String(serviceId)),
		[services, serviceId]
	);

	const durationMinutes = selectedService?.duration_minutes ?? 30;

	useEffect(() => {
		if (!slug) return;
		let cancelled = false;
		setLoading(true);
		setError('');
		Promise.all([
			fetchPublicServices(slug),
			fetchPublicProfessionals(slug),
		])
			.then(([branchesData, prosData]) => {
				if (cancelled) return;
				setBranchesWithServices(Array.isArray(branchesData) ? (branchesData as BranchWithServices[]) : []);
				setProfessionals(Array.isArray(prosData) ? (prosData as PublicProfessional[]) : []);
			})
			.catch((err: unknown) => {
				const ax = err as AxiosError<{ message?: string }>;
				if (!cancelled) {
					setError(
						ax?.response?.data?.message ||
							ax?.response?.status === 404
							? 'Negocio no encontrado'
							: 'No se pudo cargar la información.'
					);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, [slug]);

	useEffect(() => {
		if (!slug) return;
		fetchCustomerMe(slug).then((session) => {
			if (session?.account) {
				setCustomer({
					account: session.account,
					name: String(session.client?.name ?? 'Cliente'),
				});
			}
		});
	}, [slug]);

	useEffect(() => {
		if (!slug || !customer) return;
		fetchCustomerAppointments(slug)
			.then((rows) => {
				setCustomerHistory((Array.isArray(rows) ? rows : []) as CustomerAppointment[]);
			})
			.catch(() => {
				setCustomerHistory([]);
			});
	}, [slug, customer]);

	const professionalsForBranch = useMemo(() => {
		if (!branchId) return professionals;
		return professionals.filter((p) => String(p.branch_id) === String(branchId));
	}, [professionals, branchId]);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!customer) {
			setError('Debes iniciar sesión o registrarte para poder agendar.');
			return;
		}
		if (!slug || !branchId || !professionalId || !date || !time) {
			setError('Completa sucursal, profesional, fecha y hora.');
			return;
		}
		const [hours, minutes] = time.split(':').map(Number);
		const startAt = new Date(date);
		startAt.setHours(hours, minutes, 0, 0);
		const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

		setSubmitting(true);
		setError('');
		try {
			await createCustomerBooking(slug, {
				branch_id: Number(branchId),
				professional_id: Number(professionalId),
				service_id: serviceId ? Number(serviceId) : Number(selectedService?.id ?? 0),
				start_at: startAt.toISOString(),
				end_at: endAt.toISOString(),
			});
			setSuccess(true);
			const rows = await fetchCustomerAppointments(slug);
			setCustomerHistory((Array.isArray(rows) ? rows : []) as CustomerAppointment[]);
		} catch (err) {
			const ax = err as AxiosError<{ message?: string }>;
			setError(
				ax?.response?.data?.message || 'No se pudo registrar la cita. Intenta de nuevo.'
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCustomerLogin = async () => {
		if (!slug || !customerEmail || !customerPassword) return;
		setError('');
		try {
			const session = await loginCustomer(slug, {
				email: customerEmail.trim(),
				password: customerPassword,
			});
			if (session.account) {
				setCustomer({
					account: session.account,
					name: String(session.client?.name ?? 'Cliente'),
				});
			}
		} catch (err) {
			const ax = err as AxiosError<{ message?: string }>;
			setError(ax?.response?.data?.message || 'No se pudo iniciar sesión.');
		}
	};

	const handleCustomerRegister = async () => {
		if (!slug || !registerName || !customerEmail || !customerPassword) return;
		setError('');
		try {
			const session = await registerCustomer(slug, {
				name: registerName.trim(),
				email: customerEmail.trim(),
				password: customerPassword,
				phone: registerPhone.trim() || undefined,
			});
			if (session.account) {
				setCustomer({
					account: session.account,
					name: String(session.client?.name ?? registerName.trim()),
				});
			}
		} catch (err) {
			const ax = err as AxiosError<{ message?: string }>;
			setError(ax?.response?.data?.message || 'No se pudo crear tu cuenta.');
		}
	};

	const handleCustomerLogout = async () => {
		if (!slug) return;
		await logoutCustomer(slug);
		setCustomer(null);
		setCustomerHistory([]);
	};

	if (!slug) return null;

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<div className="mx-auto max-w-lg px-4 py-10">
				<h1 className="text-2xl font-semibold tracking-tight text-slate-50">
					Reservar cita
				</h1>
				<p className="mt-1 text-sm text-slate-400">
					Completa el formulario para agendar tu cita.
				</p>

				<div className="mt-5 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
					{customer ? (
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-slate-300">
								Sesión iniciada como <span className="font-semibold text-slate-100">{customer.name}</span>
							</p>
							<Button type="button" variant="subtle" size="sm" onClick={handleCustomerLogout}>
								Cerrar sesión
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-xs text-slate-300">
								¿Ya eres cliente? Inicia sesión o regístrate para ver tu historial y agendar más rápido.
							</p>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<Input
									label="Correo"
									id="customer-email"
									type="email"
									value={customerEmail}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerEmail(e.target.value)}
									placeholder="correo@ejemplo.com"
								/>
								<Input
									label="Contraseña"
									id="customer-password"
									type="password"
									value={customerPassword}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerPassword(e.target.value)}
									placeholder="********"
								/>
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<Button type="button" size="sm" onClick={handleCustomerLogin}>
									Iniciar sesión
								</Button>
								<div className="flex gap-2">
									<Input
										label="Nombre (registro)"
										id="customer-register-name"
										value={registerName}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)}
										placeholder="Tu nombre"
									/>
									<Input
										label="Teléfono"
										id="customer-register-phone"
										value={registerPhone}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterPhone(e.target.value)}
										placeholder="+52..."
									/>
								</div>
							</div>
							<Button type="button" variant="outline" size="sm" onClick={handleCustomerRegister}>
								Registrarme
							</Button>
						</div>
					)}
				</div>

				{success && (
					<div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
						Cita registrada correctamente. Te contactaremos si es necesario.
					</div>
				)}

				{error && (
					<div className="mt-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100">
						{error}
					</div>
				)}

				{loading ? (
					<div className="mt-8 text-center text-sm text-slate-400">
						Cargando...
					</div>
				) : !success ? (
					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<Select
							label="Sucursal"
							id="branch"
							value={branchId}
							onChange={(e: ChangeEvent<HTMLSelectElement>) => {
								setBranchId(e.target.value);
								setServiceId('');
							}}
							required
						>
							<option value="">Selecciona sucursal</option>
							{branches.map((b) => (
								<option key={b.id} value={b.id}>
									{b.name}
								</option>
							))}
						</Select>

						<Select
							label="Servicio"
							id="service"
							value={serviceId}
							onChange={(e: ChangeEvent<HTMLSelectElement>) => setServiceId(e.target.value)}
						>
							<option value="">Selecciona servicio (opcional)</option>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name} {s.duration_minutes ? `(${s.duration_minutes} min)` : ''}
								</option>
							))}
						</Select>

						<Select
							label="Profesional"
							id="professional"
							value={professionalId}
							onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(e.target.value)}
							required
						>
							<option value="">Selecciona profesional</option>
							{professionalsForBranch.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</Select>

						<div className="grid grid-cols-2 gap-3">
							<DatePicker
								label="Fecha"
								id="date"
								value={date || null}
								onChange={(_, dateStr) => setDate(dateStr || '')}
								minDate={new Date()}
								required
							/>
							<Input
								label="Hora"
								id="time"
								type="time"
								value={time}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
								required
							/>
						</div>

						<div className="pt-2">
							<Button type="submit" size="md" disabled={submitting || !customer} className="w-full">
								{submitting ? 'Enviando...' : 'Reservar cita'}
							</Button>
							{!customer && (
								<p className="mt-2 text-xs text-slate-400">
									Primero crea tu cuenta o inicia sesión para agendar.
								</p>
							)}
						</div>
					</form>
				) : (
					<div className="space-y-4">
						<Button
							type="button"
							variant="subtle"
							size="sm"
							className="mt-4"
							onClick={() => {
								setSuccess(false);
								setDate('');
								setTime('09:00');
							}}
						>
							Hacer otra reserva
						</Button>
						{customer && (
							<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
								<p className="mb-2 text-xs font-medium text-slate-300">Tu historial reciente</p>
								{customerHistory.length === 0 ? (
									<p className="text-xs text-slate-500">Aún no tienes citas registradas.</p>
								) : (
									<div className="space-y-2">
										{customerHistory.slice(0, 6).map((a) => (
											<div key={a.id} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs">
												<p className="text-slate-200">{new Date(String(a.start_at ?? '')).toLocaleString()}</p>
												<p className="text-slate-400">
													{a.service?.name ?? a.combined_service?.name ?? 'Servicio'} · {a.professional?.name ?? 'Profesional'}
												</p>
												<p className="text-slate-500">{a.status ?? 'scheduled'}</p>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
