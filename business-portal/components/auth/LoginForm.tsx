import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { fetchCsrfCookie, loginRequest } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Alert } from '@/components/ui';
import type { User } from '@/types';
import { swalError, swalSilentErrorText } from '@/lib/swal';

export default function LoginForm() {
	const router = useRouter();
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			await fetchCsrfCookie();
			const data = await loginRequest({ email, password });
			const user = data?.user;
			if (user) {
				login(user as User);
				router.push('/dashboard');
			}
		} catch (err) {
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al iniciar sesión', msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-slate-950/70 px-6 py-8 shadow-(--shadow-modal) backdrop-blur-2xl sm:px-8 sm:py-9">
			<div className="mb-6 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-slate-50">Iniciar sesión</h2>
					<p className="mt-1 text-xs text-slate-400">
						Acceso privado para tu negocio de belleza.
					</p>
				</div>
				<div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 text-xl shadow-[0_12px_40px_-8px_rgba(20,184,166,0.45)] ring-1 ring-white/15 sm:flex">
					🗓
				</div>
			</div>
			{error && (
				<div className="mb-5">
					<Alert variant="error">{error}</Alert>
				</div>
			)}
			<form onSubmit={handleSubmit} className="space-y-5">
				<Input
					label="Correo electrónico"
					id="login-email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="tu@correo.com"
					required
				/>
				<Input
					label="Contraseña"
					id="login-password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="********"
					required
				/>
				<Button type="submit" disabled={loading} size="full">
					{loading ? 'Entrando...' : 'Iniciar sesión'}
				</Button>
			</form>
			<p className="mt-6 text-center text-[11px] text-slate-500">
				Acceso privado para negocios de belleza: barberías, salones, spas, uñas,
				pestañas y más.
			</p>
		</div>
	);
}
