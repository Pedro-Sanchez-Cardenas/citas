import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FloatMenu } from '@/components/ui';

export default function DashboardLayout({ user, onLogout, children }) {
	const router = useRouter();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const navItems = [
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: '🏠',
		},
		{
			label: 'Agenda',
			href: '/agenda',
			icon: '📅',
		},
		{
			label: 'Citas',
			href: '/appointments',
			icon: '📝',
		},
		{
			label: 'Clientes',
			href: '/clients',
			icon: '👥',
		},
		{
			label: 'Profesionales',
			href: '/professionals',
			icon: '💇',
		},
		{
			label: 'Servicios',
			href: '/services',
			icon: '✨',
		},
		{
			label: 'Servicios combinados',
			href: '/combined-services',
			icon: '💫',
		},
		{
			label: 'Relaciones de servicio',
			href: '/service-relations',
			icon: '🔗',
		},
		{
			label: 'Categorías',
			href: '/service-categories',
			icon: '🧩',
		},
		{
			label: 'Productos',
			href: '/products',
			icon: '🧴',
		},
		{
			label: 'Inventario',
			href: '/inventory',
			icon: '📦',
		},
		{
			label: 'Pagos',
			href: '/payments',
			icon: '💳',
		},
		{
			label: 'Horarios',
			href: '/working-hours',
			icon: '⏰',
		},
		{
			label: 'Bloqueos',
			href: '/blocks',
			icon: '🚫',
		},
		{
			label: 'Automatizaciones',
			href: '/automations',
			icon: '⚙️',
		},
		{
			label: 'Reportes',
			href: '/reports',
			icon: '📊',
		},
	];

	const isActive = (href) => router.pathname === href || router.pathname.startsWith(`${href}/`);

	const toggleSidebar = () => setSidebarOpen((open) => !open);
	const closeSidebar = () => setSidebarOpen(false);

	return (
		<div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
			<div className="pointer-events-none absolute inset-0 opacity-70">
				<div className="absolute -top-32 left-10 h-56 w-56 rounded-full bg-linear-to-br from-teal-400/22 via-cyan-400/10 to-transparent blur-3xl" />
				<div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-linear-to-tr from-emerald-400/18 via-slate-900 to-transparent blur-3xl" />
			</div>

			{/* Sidebar desktop */}
			<aside className="relative z-20 hidden h-screen w-64 flex-col border-r border-slate-800/90 bg-slate-950/80 px-3 pb-5 pt-6 backdrop-blur-2xl lg:flex lg:min-h-0 lg:overflow-hidden">
				<div className="mb-6 flex items-center gap-3 border-b border-slate-800/80 pb-4">
					<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_25px_rgba(8,47,73,0.9)]">
						🗓
					</div>
					<div>
						<h2 className="text-sm font-semibold tracking-tight text-slate-50">
							Citas Pro Beauty
						</h2>
						<p className="text-[11px] text-slate-400">
							Agenda profesional para negocios de belleza
						</p>
					</div>
				</div>

				<nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-sm">
					{navItems.map((item) => {
						const active = isActive(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={closeSidebar}
								className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-tight transition ${
									active
										? 'bg-slate-900/90 text-slate-50 shadow-[0_0_0_1px_rgba(15,23,42,0.8)]'
										: 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-50'
								}`}
							>
								<span
									className={`flex h-6 w-6 items-center justify-center rounded-lg text-base ${
										active ? 'bg-teal-500/15 text-teal-200' : 'bg-slate-800/60'
									}`}
								>
									{item.icon}
								</span>
								<span>{item.label}</span>
								{active && (
									<span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-linear-to-b from-teal-400 to-cyan-400" />
								)}
							</Link>
						);
					})}
				</nav>

				<div className="relative mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-3 text-[11px] text-slate-400">
					<div className="flex items-start justify-between gap-2">
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium text-slate-100">
								{user?.name?.[0]?.toUpperCase() ?? 'U'}
							</div>
							<div className="min-w-0">
								<div className="truncate text-xs font-medium text-slate-100">
									{user?.name ?? 'Usuario'}
								</div>
								<div className="truncate text-[11px] text-slate-400">{user?.email}</div>
							</div>
						</div>
						<FloatMenu
							placement="top-end"
							className="shrink-0"
							options={[
								{
									label: 'Ver perfil',
									onClick: () => {
										closeSidebar();
										router.push('/profile');
									},
								},
								{ divider: true },
								{ label: 'Cerrar sesión', onClick: onLogout },
							]}
						>
							<button
								type="button"
								className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-200"
								aria-label="Opciones de cuenta"
							>
								⋮
							</button>
						</FloatMenu>
					</div>
				</div>
			</aside>

			{/* Mobile sidebar + header */}
			<div className="flex flex-1 flex-col min-h-0">
				<header className="relative z-30 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 backdrop-blur-2xl lg:hidden">
					<button
						type="button"
						onClick={toggleSidebar}
						className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/80 text-slate-100 shadow-sm"
						aria-label="Abrir menú"
					>
						<span className="sr-only">Abrir menú</span>
						<span className="flex flex-col gap-1.5">
							<span className="block h-0.5 w-5 rounded-full bg-slate-100" />
							<span className="block h-0.5 w-4 rounded-full bg-slate-300" />
							<span className="block h-0.5 w-3.5 rounded-full bg-slate-500" />
						</span>
					</button>

					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-500 text-base shadow-[0_10px_25px_rgba(8,47,73,0.9)]">
							🗓
						</div>
						<div className="min-w-0">
							<p className="truncate text-xs font-semibold text-slate-50">
								Citas Pro Beauty
							</p>
							<p className="truncate text-[11px] text-slate-400">
								Panel de administración
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={() => router.push('/profile')}
						className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-100"
					>
						{user?.name?.[0]?.toUpperCase() ?? 'U'}
					</button>
				</header>

				{/* Mobile sidebar panel */}
				{sidebarOpen && (
					<div className="fixed inset-0 z-30 flex lg:hidden">
						<div
							className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
							onClick={closeSidebar}
						/>
						<aside className="relative z-40 flex h-full w-72 flex-col border-r border-slate-800/90 bg-slate-950/95 px-5 pb-5 pt-6 shadow-xl overflow-hidden">
							<div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
								<div className="flex items-center gap-3">
									<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-500 text-lg shadow-[0_10px_25px_rgba(8,47,73,0.9)]">
										🗓
									</div>
									<div>
										<h2 className="text-sm font-semibold tracking-tight text-slate-50">
											Citas Pro Beauty
										</h2>
										<p className="text-[11px] text-slate-400">Menú principal</p>
									</div>
								</div>
								<button
									type="button"
									onClick={closeSidebar}
									className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700"
									aria-label="Cerrar menú"
								>
									✕
								</button>
							</div>

							<nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-sm">
								{navItems.map((item) => {
									const active = isActive(item.href);
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={closeSidebar}
											className={`group relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium tracking-tight transition ${
												active
													? 'bg-slate-900/90 text-slate-50 shadow-[0_0_0_1px_rgba(15,23,42,0.8)]'
													: 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-50'
											}`}
										>
											<span
												className={`flex h-6 w-6 items-center justify-center rounded-lg text-base ${
													active
														? 'bg-teal-500/15 text-teal-200'
														: 'bg-slate-800/60'
												}`}
											>
												{item.icon}
											</span>
											<span>{item.label}</span>
										</Link>
									);
								})}
							</nav>

							<div className="relative mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-3 text-[11px] text-slate-400">
								<div className="flex items-start justify-between gap-2">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium text-slate-100">
											{user?.name?.[0]?.toUpperCase() ?? 'U'}
										</div>
										<div className="min-w-0">
											<div className="truncate text-xs font-medium text-slate-100">
												{user?.name ?? 'Usuario'}
											</div>
											<div className="truncate text-[11px] text-slate-400">
												{user?.email}
											</div>
										</div>
									</div>
									<FloatMenu
										placement="top-end"
										className="shrink-0"
										options={[
											{
												label: 'Ver perfil',
												onClick: () => {
													closeSidebar();
													router.push('/profile');
												},
											},
											{ divider: true },
											{ label: 'Cerrar sesión', onClick: onLogout },
										]}
									>
										<button
											type="button"
											className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-200"
											aria-label="Opciones de cuenta"
										>
											⋮
										</button>
									</FloatMenu>
								</div>
							</div>
						</aside>
					</div>
				)}

				<main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
					{children}
				</main>
			</div>
		</div>
	);
}
