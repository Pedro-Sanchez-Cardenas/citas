import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { fetchPublicProfessionals, fetchPublicServices } from '@/lib/api/publicBooking';
import {
	createCustomerBooking,
	fetchCustomerAppointments,
	fetchCustomerMe,
	loginCustomer,
	logoutCustomer,
	registerCustomer,
	type CustomerAccount,
} from '@/lib/api/customerPortal';
import { Button, DatePicker, Input, Select } from '@/components/ui';
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

interface PublicBusinessInfo {
	name?: string;
	branding?: {
		logo_url?: string | null;
    hero_image_url?: string | null;
    primary_color?: string | null;
		public_booking_title?: string | null;
		public_booking_subtitle?: string | null;
	};
}

export default function PublicBookPage() {
	const router = useRouter();
	const { slug } = router.query as { slug?: string };
	const [activeAuthTab, setActiveAuthTab] = useState<'login' | 'register'>('login');
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3 | 4>(1);
	const [business, setBusiness] = useState<PublicBusinessInfo | null>(null);
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
	const brandName = business?.name || (slug ? String(slug) : 'Tu salón');
	const brandLogo = business?.branding?.logo_url || null;
  const heroImage = business?.branding?.hero_image_url || null;
  const primaryColor = business?.branding?.primary_color || '#14b8a6';
	const headline = business?.branding?.public_booking_title || `Agenda tu cita en ${brandName}`;
	const subtitle =
		business?.branding?.public_booking_subtitle ||
		'Inicia sesión o regístrate para reservar y consultar tu historial.';

	useEffect(() => {
		if (!slug) return;
		let cancelled = false;
		setLoading(true);
		setError('');

		Promise.all([fetchPublicServices(slug), fetchPublicProfessionals(slug)])
			.then(([catalog, prosData]) => {
				if (cancelled) return;
				setBusiness((catalog?.business as PublicBusinessInfo) ?? null);
				setBranchesWithServices((Array.isArray(catalog?.branches) ? catalog.branches : []) as BranchWithServices[]);
				setProfessionals(Array.isArray(prosData) ? (prosData as PublicProfessional[]) : []);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				const ax = err as AxiosError<{ message?: string }>;
				if (ax?.response?.status === 404) {
					setError('Negocio no encontrado.');
				} else {
					setError(ax?.response?.data?.message || 'No se pudo cargar la información del negocio.');
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
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

  useEffect(() => {
    if (!customer) {
      setMobileStep(1);
      return;
    }
    if (mobileStep === 1) setMobileStep(2);
  }, [customer, mobileStep]);

	const professionalsForBranch = useMemo(() => {
		if (!branchId) return professionals;
		return professionals.filter((p) => String(p.branch_id) === String(branchId));
	}, [professionals, branchId]);

	const handleSubmitBooking = async (e: FormEvent<HTMLFormElement>) => {
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
			setError(ax?.response?.data?.message || 'No se pudo registrar la cita. Intenta de nuevo.');
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
		setSuccess(false);
    setMobileStep(1);
	};

  const canGoStep3 = !!branchId && !!professionalId;
  const canGoStep4 = canGoStep3 && !!date && !!time;

	if (!slug) return null;

	return (
		<div
      className="min-h-screen text-slate-100"
      style={{
        backgroundImage: heroImage
          ? `linear-gradient(rgba(2, 6, 23, 0.86), rgba(2, 6, 23, 0.95)), url(${heroImage})`
          : 'radial-gradient(ellipse at top, rgb(30 41 59), rgb(15 23 42), rgb(2 6 23))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
			<div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-10 lg:grid-cols-[380px_1fr]">
				<aside className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-2xl backdrop-blur">
					<div className="mb-4 flex items-center gap-3">
						{brandLogo ? (
							<img src={brandLogo} alt={brandName} className="h-14 w-14 rounded-2xl border border-slate-700 bg-slate-950 object-cover" />
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-500/10 text-lg font-semibold text-teal-200">
								{brandName.trim().charAt(0).toUpperCase()}
							</div>
						)}
						<div>
							<p className="text-[11px] uppercase tracking-[0.16em] text-teal-300">Portal clientes</p>
							<h1 className="text-lg font-semibold text-slate-50">{brandName}</h1>
						</div>
					</div>

					<p className="text-sm font-medium text-slate-100">{headline}</p>
					<p className="mt-1 text-xs text-slate-400">{subtitle}</p>

					{customer ? (
						<div className="mt-6 space-y-3">
							<div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
								Sesión iniciada como <span className="font-semibold">{customer.name}</span>
							</div>
							<Button type="button" size="sm" variant="subtle" className="w-full" onClick={handleCustomerLogout}>
								Cerrar sesión
							</Button>
						</div>
					) : (
						<div className="mt-6">
							<div className="mb-3 flex rounded-xl border border-slate-700/70 bg-slate-950/60 p-1">
								<button
									type="button"
									onClick={() => setActiveAuthTab('login')}
									className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeAuthTab === 'login' ? 'text-slate-950' : 'text-slate-300 hover:text-slate-100'
										}`}
                  style={activeAuthTab === 'login' ? { backgroundColor: primaryColor } : undefined}
								>
									Iniciar sesión
								</button>
								<button
									type="button"
									onClick={() => setActiveAuthTab('register')}
									className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeAuthTab === 'register' ? 'text-slate-950' : 'text-slate-300 hover:text-slate-100'
										}`}
                  style={activeAuthTab === 'register' ? { backgroundColor: primaryColor } : undefined}
								>
									Registrarme
								</button>
							</div>

							<div className="space-y-3">
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

								{activeAuthTab === 'register' && (
									<>
										<Input
											label="Nombre completo"
											id="customer-register-name"
											value={registerName}
											onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterName(e.target.value)}
											placeholder="Tu nombre"
										/>
										<Input
											label="Teléfono (opcional)"
											id="customer-register-phone"
											value={registerPhone}
											onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterPhone(e.target.value)}
											placeholder="+52..."
										/>
									</>
								)}
								<Button
									type="button"
									size="sm"
									className="w-full"
									onClick={activeAuthTab === 'login' ? handleCustomerLogin : handleCustomerRegister}
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: '#020617' }}
								>
									{activeAuthTab === 'login' ? 'Entrar al portal' : 'Crear mi cuenta'}
								</Button>
							</div>
						</div>
					)}

					<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
						<p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Ventajas</p>
						<ul className="mt-2 space-y-2 text-xs text-slate-300">
							<li>Reserva en segundos sin llamar al salón.</li>
							<li>Consulta tu historial de citas cuando quieras.</li>
							<li>Todo desde tu cuenta de cliente.</li>
						</ul>
					</div>
				</aside>

				<main className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div>
							<h2 className="text-xl font-semibold text-slate-50">Agendar cita</h2>
							<p className="text-xs text-slate-400">Selecciona servicio, profesional y horario.</p>
						</div>
					</div>

          <div className="mb-4 grid grid-cols-4 gap-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2 lg:hidden">
            {[
              { step: 1, label: 'Login' },
              { step: 2, label: 'Servicio' },
              { step: 3, label: 'Fecha' },
              { step: 4, label: 'Confirmar' },
            ].map((item) => {
              const isActive = mobileStep === item.step;
              const isDone = mobileStep > item.step;
              return (
                <div
                  key={item.step}
                  className={`rounded-lg px-2 py-1 text-center text-[11px] font-medium ${
                    isActive ? 'text-slate-950' : isDone ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                  style={isActive ? { backgroundColor: primaryColor } : undefined}
                >
                  {item.label}
                </div>
              );
            })}
          </div>

					{error && (
						<div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100">
							{error}
						</div>
					)}
					{success && (
						<div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
							Cita registrada correctamente.
						</div>
					)}

					{loading ? (
						<div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
							Cargando disponibilidad...
						</div>
					) : (
						<form onSubmit={handleSubmitBooking} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`md:contents ${mobileStep !== 2 ? 'hidden lg:contents' : ''}`}>
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
              </div>

              <div className={`md:contents ${mobileStep !== 3 ? 'hidden lg:contents' : ''}`}>
                <DatePicker
                  label="Fecha"
                  id="date"
                  value={date || null}
                  onChange={(_, dateStr) => setDate(dateStr || '')}
                  minDate={new Date()}
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="Hora"
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={`md:contents ${mobileStep !== 4 ? 'hidden lg:contents' : ''}`}>
                <div className="md:col-span-2 rounded-xl border border-slate-800/70 bg-slate-950/50 p-3 text-xs text-slate-300">
                  <p><span className="text-slate-500">Sucursal:</span> {branches.find((b) => String(b.id) === branchId)?.name || '—'}</p>
                  <p><span className="text-slate-500">Servicio:</span> {selectedService?.name || 'No especificado'}</p>
                  <p><span className="text-slate-500">Profesional:</span> {professionalsForBranch.find((p) => String(p.id) === professionalId)?.name || '—'}</p>
                  <p><span className="text-slate-500">Horario:</span> {date || '—'} {time || ''}</p>
                </div>
              </div>

							<div className="md:col-span-2 mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                {mobileStep > 2 && (
                  <Button type="button" variant="subtle" size="sm" onClick={() => setMobileStep((prev) => Math.max(2, prev - 1) as 2 | 3 | 4)} className="lg:hidden">
                    Volver
                  </Button>
                )}
                {mobileStep === 2 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setMobileStep(3)}
                    disabled={!canGoStep3}
                    className="lg:hidden"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: '#020617' }}
                  >
                    Siguiente
                  </Button>
                )}
                {mobileStep === 3 && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setMobileStep(4)}
                    disabled={!canGoStep4}
                    className="lg:hidden"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: '#020617' }}
                  >
                    Revisar
                  </Button>
                )}
								<Button type="submit" size="md" disabled={submitting || !customer}>
									{submitting ? 'Agendando...' : 'Confirmar cita'}
								</Button>
								{!customer && (
									<p className="text-xs text-slate-400">Debes iniciar sesión o registrarte para confirmar la cita.</p>
								)}
								{success && (
									<Button
										type="button"
										variant="subtle"
										size="sm"
										onClick={() => {
											setSuccess(false);
											setDate('');
											setTime('09:00');
										}}
									>
										Agendar otra
									</Button>
								)}
							</div>
						</form>
					)}

					{customer && (
						<section className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
							<h3 className="mb-3 text-sm font-semibold text-slate-100">Tu historial reciente</h3>
							{customerHistory.length === 0 ? (
								<p className="text-xs text-slate-500">Aún no tienes citas registradas.</p>
							) : (
								<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
									{customerHistory.slice(0, 6).map((a) => (
										<div key={a.id} className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs">
											<p className="text-slate-200">{new Date(String(a.start_at ?? '')).toLocaleString()}</p>
											<p className="text-slate-400">
												{a.service?.name ?? a.combined_service?.name ?? 'Servicio'} - {a.professional?.name ?? 'Profesional'}
											</p>
											<p className="text-slate-500">{a.status ?? 'scheduled'}</p>
										</div>
									))}
								</div>
							)}
						</section>
					)}
				</main>
			</div>
		</div>
	);
}
