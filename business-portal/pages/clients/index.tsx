import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
	fetchClients,
	createClient,
	updateClient,
	deleteClient,
	type CreateClientPayload,
} from '@/lib/api/clients';
import { clientPhotoUrl } from '@/lib/api';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate } from '@/lib/format';
import {
	Button,
	Table,
	FloatMenu,
	PageHeader,
	EmptyState,
	Alert,
	SearchBar,
	PageLoading,
} from '@/components/ui';
import { ClientDetailModal, ClientFormModal } from '@/components/clients';
import type { Client } from '@/types';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function ClientsPage() {
	const router = useRouter();
	const { user, loading: authLoading, logout } = useAuth();

	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
	const [selectedClient, setSelectedClient] = useState<Client | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [detailClient, setDetailClient] = useState<Client | null>(null);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/');
			return;
		}
	}, [authLoading, user, router]);

	useEffect(() => {
		if (!user) return;

		let cancelled = false;

		async function loadClients() {
			setLoading(true);
			setError('');
			try {
				const data = await fetchClients();
				if (!cancelled) {
					setClients(Array.isArray(data) ? data : []);
				}
			} catch (err) {
				if (!cancelled) {
					const ax = err as AxiosError<{ message?: string }>;
					setError(
						ax?.response?.data?.message ||
						'No se pudieron cargar los clientes.'
					);
					if (ax?.response?.status === 401) {
						logout();
					}
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		loadClients();

		return () => {
			cancelled = true;
		};
	}, [user, logout]);

	const filteredClients = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return clients;
		return clients.filter((client) => {
			const name = String(client.name ?? '').toLowerCase();
			const email = String(client.email ?? '').toLowerCase();
			const phone = String(client.phone ?? '').toLowerCase();
			return (
				name.includes(q) ||
				email.includes(q) ||
				phone.includes(q)
			);
		});
	}, [clients, search]);

	const isLoading = authLoading || loading;

	const openCreateModal = () => {
		setFieldErrors({});
		setSelectedClient(null);
		setModalOpen(true);
	};

	const openEditModal = (client: Client) => {
		setFieldErrors({});
		setSelectedClient(client);
		setModalOpen(true);
	};

	const handleSubmitClient = async (formData: CreateClientPayload, photo?: File | null) => {
		setModalLoading(true);
		setError('');
		setFieldErrors({});
		try {
			if (selectedClient?.id) {
				const updated = await updateClient(selectedClient.id, formData, photo);
				setClients((prev) =>
					prev.map((c) => (c.id === selectedClient.id ? updated ?? c : c))
				);
			} else {
				const created = await createClient(formData, photo);
				if (created) setClients((prev) => [created, ...prev]);
			}
			setModalOpen(false);
			setSelectedClient(null);
			void swalSuccess('Guardado correcto', 'El cliente se guardó correctamente.');
		} catch (err) {
			setFieldErrors(extractFieldErrors(err));
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al guardar', msg);
		} finally {
			setModalLoading(false);
		}
	};

	const handleDeleteClient = async (id: number) => {
		const ok = await swalConfirm({
			title: 'Eliminar cliente',
			text: 'Esta acción no se puede deshacer.',
			icon: 'warning',
			confirmButtonText: 'Eliminar',
			cancelButtonText: 'Cancelar',
		});
		if (!ok) return;
		setDeletingId(id);
		setError('');
		try {
			await deleteClient(id);
			setClients((prev) => prev.filter((c) => c.id !== id));
			void swalSuccess('Eliminado', 'El cliente se eliminó correctamente.');
		} catch (err) {
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al eliminar', msg);
		} finally {
			setDeletingId(null);
		}
	};

	if (!authLoading && !user) {
		return null;
	}

	return (
		<>
			<ClientDetailModal
				open={!!detailClient}
				onClose={() => setDetailClient(null)}
				client={detailClient}
			/>
			<ClientFormModal
				open={modalOpen}
				onClose={() => {
					if (!modalLoading) {
						setFieldErrors({});
						setModalOpen(false);
						setSelectedClient(null);
					}
				}}
				onSubmit={handleSubmitClient}
				initialData={selectedClient}
				loading={modalLoading}
				fieldErrors={fieldErrors}
			/>

			<>
				<PageHeader
					title="Clientes"
					subtitle="Mantén un registro claro de tus clientes para ofrecerles un servicio memorable en cada visita."
					action={
						<Button type="button" onClick={openCreateModal} size="md">
							<span className="mr-2 text-base" aria-hidden>+</span>
							Nuevo cliente
						</Button>
					}
				/>

				<div className="page-filters" role="search" aria-label="Filtrar clientes">
					<SearchBar
						id="clients-search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar por nombre, correo o teléfono..."
						className="min-w-0 flex-1"
					/>
					<p className="text-xs text-slate-500 tabular-nums sm:max-w-[12rem] sm:text-right">
						{search.trim()
							? `${filteredClients.length} de ${clients.length} clientes`
							: `${clients.length} cliente${clients.length === 1 ? '' : 's'}`}
					</p>
				</div>

				{error && (
					<div className="mb-4">
						<Alert variant="error">{error}</Alert>
					</div>
				)}

				{isLoading ? (
					<PageLoading label="Cargando clientes..." />
				) : filteredClients.length === 0 ? (
					<EmptyState
						icon="👤"
						title={search.trim() ? 'No hay resultados' : 'Aún no hay clientes'}
						description={
							search.trim()
								? 'Prueba con otro término de búsqueda.'
								: 'Registra clientes para llevar historial, preferencias y comunicación.'
						}
						action={
							!search.trim() ? (
								<Button type="button" variant="outline" size="sm" onClick={openCreateModal}>
									Crear primer cliente
								</Button>
							) : null
						}
					/>
				) : (
						<Table<Client>
							columns={[
								{ key: 'name', header: 'Nombre' },
								{ key: 'contact', header: 'Contacto' },
								{ key: 'birthday', header: 'Cumpleaños' },
								{ key: 'actions', header: 'Acciones', align: 'right' },
							]}
							items={filteredClients}
							getItemKey={(client) => client.id}
							renderCell={(client, key) => {
								if (key === 'name') {
									return (
										<div className="flex items-center gap-3">
											<div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.1] bg-slate-950/60 ring-1 ring-white/[0.06]">
												{client.photo_url ? (
													<img
														src={clientPhotoUrl(client.photo_url) ?? ''}
														alt=""
														className="h-full w-full object-cover"
													/>
												) : (
													<span className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
														{client.name?.[0]?.toUpperCase() ?? '?'}
													</span>
												)}
											</div>
											<span className="text-sm font-medium text-slate-50">{client.name}</span>
										</div>
									);
								}

								if (key === 'contact') {
									return (
										<div className="space-y-0.5 text-xs text-slate-400">
											{client.email && <div>{client.email}</div>}
											{client.phone && (
												<div className="text-slate-500">{client.phone}</div>
											)}
											{!client.email && !client.phone && '—'}
										</div>
									);
								}

								if (key === 'birthday') {
									return (
										<span className="text-xs text-slate-200">
											{formatDate(client.birthday)}
										</span>
									);
								}

								if (key === 'actions') {
									return (
										<div className="flex justify-end">
											<FloatMenu
												placement="bottom-end"
												options={[
													{ label: 'Ver detalle', onClick: () => setDetailClient(client) },
													{ label: 'Editar', onClick: () => openEditModal(client) },
													{ divider: true },
													{
														label: deletingId === client.id ? 'Eliminando...' : 'Eliminar',
														onClick: () => handleDeleteClient(client.id),
														disabled: deletingId === client.id,
													},
												]}
											>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="min-h-[36px] text-slate-400 hover:text-slate-100"
													aria-label="Acciones"
												>
													⋮
												</Button>
											</FloatMenu>
										</div>
									);
								}

								return null;
							}}
						/>
				)}
			</>
		</>
	);
}
