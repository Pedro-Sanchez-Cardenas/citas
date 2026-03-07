'use client';

import Link from 'next/link';
import { FloatMenu } from '@/components/ui';
import clsx from 'clsx';

const BRAND = {
	name: 'Citas Pro Beauty',
	tagline: 'Agenda profesional para negocios de belleza',
	icon: '🗓',
};

export default function Sidebar({
	user,
	userMenuOptions = [],
	navItems,
	isActive,
	onClose,
	open = false,
	variant = 'desktop',
}) {
	const isMobile = variant === 'mobile';

	const content = (
		<>
			{/* Logo / Brand */}
			<div className="flex shrink-0 items-center gap-3 border-b border-slate-800/80 pb-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-xl shadow-lg shadow-teal-500/20 ring-1 ring-white/10">
					{BRAND.icon}
				</div>
				<div className="min-w-0">
					<h2 className="truncate text-sm font-semibold tracking-tight text-slate-50">
						{BRAND.name}
					</h2>
					<p className="truncate text-[11px] text-slate-400">{BRAND.tagline}</p>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 space-y-0.5 overflow-y-auto py-4 pr-1 scrollbar-thin" aria-label="Navegación principal">
				{navItems.map((item) => {
					const active = isActive(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onClose}
							className={clsx(
								'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
								active
									? 'bg-slate-800/90 text-slate-50 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]'
									: 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
							)}
						>
							<span
								className={clsx(
									'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition-colors',
									active ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80'
								)}
							>
								{item.icon}
							</span>
							<span className="truncate">{item.label}</span>
							{active && (
								<span
									className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-teal-400 to-cyan-400"
									aria-hidden
								/>
							)}
						</Link>
					);
				})}
			</nav>

			{/* User card */}
			<div className="shrink-0 pt-2">
				<div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-3 ring-1 ring-slate-800/50">
					<div className="flex items-start justify-between gap-2">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-semibold text-slate-100 ring-1 ring-slate-700/80">
								{user?.name?.[0]?.toUpperCase() ?? 'U'}
							</div>
							<div className="min-w-0">
								<div className="truncate text-sm font-medium text-slate-100">
									{user?.name ?? 'Usuario'}
								</div>
								<div className="truncate text-[11px] text-slate-400">{user?.email}</div>
							</div>
						</div>
						<FloatMenu
							placement="top-end"
							className="shrink-0"
							options={userMenuOptions}
						>
							<button
								type="button"
								className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800/80 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
								aria-label="Opciones de cuenta"
							>
								<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
									<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
								</svg>
							</button>
						</FloatMenu>
					</div>
				</div>
			</div>
		</>
	);

	if (isMobile) {
		return (
			<>
				<div
					className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
					aria-hidden
					onClick={onClose}
				/>
				<aside
					className={clsx(
						'fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-slate-950/95 px-4 pb-6 pt-6 shadow-2xl ring-1 ring-slate-800/80 backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden',
						open ? 'translate-x-0' : '-translate-x-full'
					)}
					aria-label="Menú de navegación"
				>
					<div className="mb-2 flex items-center justify-end">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
							aria-label="Cerrar menú"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					{content}
				</aside>
			</>
		);
	}

	return (
		<aside
			className="flex h-full w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 px-3 pb-5 pt-6 backdrop-blur-xl"
			aria-label="Barra lateral"
		>
			{content}
		</aside>
	);
}
