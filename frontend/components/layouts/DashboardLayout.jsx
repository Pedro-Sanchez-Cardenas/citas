'use client';

import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const NAV_ITEMS = [
	{ label: 'Dashboard', href: '/dashboard', icon: '🏠' },
	{ label: 'Agenda', href: '/agenda', icon: '📅' },
	{ label: 'Citas', href: '/appointments', icon: '📝' },
	{ label: 'Clientes', href: '/clients', icon: '👥' },
	{ label: 'Profesionales', href: '/professionals', icon: '💇' },
	{ label: 'Servicios', href: '/services', icon: '✨' },
	{ label: 'Servicios combinados', href: '/combined-services', icon: '💫' },
	{ label: 'Relaciones de servicio', href: '/service-relations', icon: '🔗' },
	{ label: 'Categorías', href: '/service-categories', icon: '🧩' },
	{ label: 'Productos', href: '/products', icon: '🧴' },
	{ label: 'Inventario', href: '/inventory', icon: '📦' },
	{ label: 'Pagos', href: '/payments', icon: '💳' },
	{ label: 'Horarios', href: '/working-hours', icon: '⏰' },
	{ label: 'Bloqueos', href: '/blocks', icon: '🚫' },
	{ label: 'Automatizaciones', href: '/automations', icon: '⚙️' },
	{ label: 'Reportes', href: '/reports', icon: '📊' },
];

export default function DashboardLayout({ user, onLogout, children }) {
	const router = useRouter();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const isActive = (href) =>
		router.pathname === href || router.pathname.startsWith(`${href}/`);

	const closeSidebar = () => setSidebarOpen(false);

	const userMenuOptions = useMemo(
		() => [
			{
				label: 'Ver perfil',
				onClick: () => {
					closeSidebar();
					router.push('/profile');
				},
			},
			{ divider: true },
			{ label: 'Cerrar sesión', onClick: onLogout },
		],
		[onLogout, router]
	);

	return (
		<div className="relative flex h-screen overflow-hidden bg-slate-950 text-slate-100">
			{/* Background ambient */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
				<div className="absolute -top-40 left-0 h-72 w-72 rounded-full bg-teal-500/[0.07] blur-[100px]" />
				<div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-[120px]" />
			</div>

			{/* Sidebar desktop */}
			<div className="relative z-20 hidden h-screen shrink-0 lg:block">
				<Sidebar
					variant="desktop"
					user={user}
					userMenuOptions={userMenuOptions}
					navItems={NAV_ITEMS}
					isActive={isActive}
				/>
			</div>

			{/* Sidebar mobile (drawer) */}
			<Sidebar
				variant="mobile"
				user={user}
				userMenuOptions={userMenuOptions}
				navItems={NAV_ITEMS}
				isActive={isActive}
				open={sidebarOpen}
				onClose={closeSidebar}
			/>

			{/* Main area: navbar + content */}
			<div className="relative z-10 flex min-w-0 flex-1 flex-col min-h-0">
				<Navbar
					user={user}
					userMenuOptions={userMenuOptions}
					onMenuClick={() => setSidebarOpen(true)}
					className="lg:hidden"
				/>

				<main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
					{children}
				</main>
			</div>
		</div>
	);
}
