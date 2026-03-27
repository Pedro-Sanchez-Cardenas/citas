import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import {
	fetchWorkingHours,
	createWorkingHour,
	updateWorkingHour,
	deleteWorkingHour,
	type WorkingHourGroup,
	type WorkingHourBlock,
	type CreateWorkingHourPayload,
} from '@/components/working-hours/api/workingHours';
import {
	fetchBlocks,
	createBlock,
	deleteBlock,
	type Block,
	type CreateBlockPayload,
} from '@/lib/api/blocks';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchBranches } from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate, formatDateTime } from '@/lib/format';
import {
	Button,
	Table,
	FloatMenu,
	EmptyState,
	Alert,
	PageHeader,
	SearchBar,
	PageLoading,
} from '@/components/ui';
import { WorkingHourFormModal, WEEKDAYS, WEEKDAY_SHORT } from '@/components/working-hours';
import { BlockFormModal } from '@/components/blocks';
import type { Branch, Professional } from '@/types';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSuccess, swalSilentErrorText } from '@/lib/swal';

type HourGroup = WorkingHourGroup;

type TabId = 'availability' | 'blocks';

const TABS: { id: TabId; label: string; icon: string }[] = [
	{ id: 'availability', label: 'Disponibilidad', icon: '⏰' },
	{ id: 'blocks', label: 'Bloqueos', icon: '🚫' },
];

export default function WorkingHoursPage() {
	const router = useRouter();
	const { user, loading: authLoading, logout } = useAuth();

	const [activeTab, setActiveTab] = useState<TabId>('availability');
	const [hours, setHours] = useState<HourGroup[]>([]);
	const [blocks, setBlocks] = useState<Block[]>([]);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [professionals, setProfessionals] = useState<Professional[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [hourModalOpen, setHourModalOpen] = useState(false);
	const [blockModalOpen, setBlockModalOpen] = useState(false);
	const [hourModalLoading, setHourModalLoading] = useState(false);
	const [blockModalLoading, setBlockModalLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
	const [selectedHour, setSelectedHour] = useState<WorkingHourBlock & {
		branch_id?: number | null;
		professional_id?: number | null;
		weekdays?: number[];
	} | null>(null);
	const [deletingHourId, setDeletingHourId] = useState<number | null>(null);
	const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);

	const tabFromQuery = (router.query.tab as string) === 'blocks' ? 'blocks' : 'availability';
	useEffect(() => {
		setActiveTab(tabFromQuery);
	}, [tabFromQuery]);

	useEffect(() => {
		if (!authLoading && !user) {
			router.replace('/');
			return;
		}
	}, [authLoading, user, router]);

	useEffect(() => {
		if (!user) return;
		let cancelled = false;
		async function loadData() {
			setLoading(true);
			setError('');
			try {
				const [hoursData, blocksData, professionalsData, branchesData] = await Promise.all([
					fetchWorkingHours(),
					fetchBlocks(),
					fetchProfessionals(),
					fetchBranches(),
				]);
				if (!cancelled) {
					setHours(Array.isArray(hoursData) ? hoursData : []);
					setBlocks(Array.isArray(blocksData) ? blocksData : []);
					setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
					setBranches(Array.isArray(branchesData) ? branchesData : []);
				}
			} catch (err) {
				if (!cancelled) {
					const ax = err as AxiosError<{ message?: string }>;
					setError(
						ax?.response?.data?.message || 'No se pudieron cargar los datos.'
					);
					if (ax?.response?.status === 401) logout();
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		loadData();
		return () => { cancelled = true; };
	}, [user, logout]);

	const professionalById = useMemo(() => {
		const map = new Map<number, Professional>();
		professionals.forEach((p) => map.set(p.id, p));
		return map;
	}, [professionals]);

	const filteredHours = useMemo(() => {
		const q = search.trim().toLowerCase();
		const list = !q
			? hours
			: hours.filter((group) => {
					const professionalName = group.professional_name.toLowerCase();
					const weekdaysLabel = group.weekdays.map((w) => WEEKDAYS[w] ?? '').join(' ').toLowerCase();
					return professionalName.includes(q) || weekdaysLabel.includes(q);
				});

		return [...list].sort((a, b) => {
			const branchCmp = a.branch_name.localeCompare(b.branch_name);
			if (branchCmp !== 0) return branchCmp;
			return a.professional_name.localeCompare(b.professional_name);
		});
	}, [hours, search]);

	const filteredBlocks = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return blocks;
		return blocks.filter((b) => {
			const blockWithProfessional = b as Block & { professional?: { name: string } };
			const professionalName = String(
				blockWithProfessional.professional?.name ??
				professionalById.get(b.professional_id ?? 0)?.name ??
				''
			).toLowerCase();
			const reason = String(b.reason ?? '').toLowerCase();
			const type = String(b.type ?? '').toLowerCase();
			return professionalName.includes(q) || reason.includes(q) || type.includes(q);
		});
	}, [blocks, search, professionalById]);

	const branchById = useMemo(() => {
		const map = new Map<number, Branch>();
		branches.forEach((b) => map.set(b.id, b));
		return map;
	}, [branches]);

	const isLoading = authLoading || loading;

	const openCreateHourModal = () => {
		setFieldErrors({});
		setSelectedHour(null);
		setHourModalOpen(true);
	};

	const openEditHourModal = (group: HourGroup) => {
		const firstBlock = group.hours[0];
		if (!firstBlock) return;

		setFieldErrors({});
		setSelectedHour({
			id: firstBlock.id,
			ids: firstBlock.ids,
			branch_id: group.branch_id ?? null,
			professional_id: group.professional_id ?? null,
			weekdays: group.weekdays,
			start_time: firstBlock.start_time,
			end_time: firstBlock.end_time,
			effective_from: firstBlock.effective_from,
			effective_until: firstBlock.effective_until,
			is_active: firstBlock.is_active,
		} as any);
		setHourModalOpen(true);
	};

	const openCreateBlockModal = () => {
		setFieldErrors({});
		setBlockModalOpen(true);
	};

	const handleSubmitHour = async (formData: CreateWorkingHourPayload) => {
		setHourModalLoading(true);
		setError('');
		setFieldErrors({});
		try {
			if (selectedHour?.id) {
				// Edición: delegamos la lógica al backend con un único payload
				await updateWorkingHour(selectedHour.id, formData);
			} else {
				// Creación: el backend se encarga de crear los registros necesarios
				await createWorkingHour(formData);
			}
			// Tras crear/editar, recargamos los horarios desde el servidor
			const hoursData = await fetchWorkingHours();
			setHours(Array.isArray(hoursData) ? hoursData : []);
			void swalSuccess('Guardado correcto', 'El horario se guardó correctamente.');
			setHourModalOpen(false);
			setSelectedHour(null);
		} catch (err) {
			setFieldErrors(extractFieldErrors(err));
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al guardar', msg);
		} finally {
			setHourModalLoading(false);
		}
	};

	const handleDeleteHourIds = async (ids: number[]) => {
		if (!ids.length) return;
		const ok = await swalConfirm({
			title: 'Eliminar bloque horario',
			text: 'Esta acción no se puede deshacer.',
			icon: 'warning',
			confirmButtonText: 'Eliminar',
			cancelButtonText: 'Cancelar',
		});
		if (!ok) return;

		// Usamos el primer id como "señal" de loading/deshabilitado en UI.
		setDeletingHourId(ids[0]);
		setError('');

		try {
			for (const id of ids) {
				await deleteWorkingHour(id);
			}
			// Recargamos la lista agrupada después de eliminar
			const hoursData = await fetchWorkingHours();
			setHours(Array.isArray(hoursData) ? hoursData : []);
			void swalSuccess('Eliminado', 'El bloque horario se eliminó correctamente.');
		} catch (err) {
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al eliminar', msg);
		} finally {
			setDeletingHourId(null);
		}
	};

	const handleDeleteGroup = async (group: HourGroup) => {
		const ids = Array.from(new Set(group.hours.flatMap((h) => h.ids)));
		if (!ids.length) return;

		const ok = await swalConfirm({
			title: 'Eliminar grupo de horarios',
			text: 'Esta acción no se puede deshacer.',
			icon: 'warning',
			confirmButtonText: 'Eliminar',
			cancelButtonText: 'Cancelar',
		});

		if (!ok) {
			return;
		}

		// Usamos el primer id como señal de loading/deshabilitado en UI
		setDeletingHourId(ids[0]);
		setError('');
		try {
			for (const id of ids) {
				await deleteWorkingHour(id);
			}
			const hoursData = await fetchWorkingHours();
			setHours(Array.isArray(hoursData) ? hoursData : []);
			setHourModalOpen(false);
			setSelectedHour(null);
			void swalSuccess('Eliminado', 'El grupo de horarios se eliminó correctamente.');
		} catch (err) {
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al eliminar', msg);
		} finally {
			setDeletingHourId(null);
		}
	};

	const handleSubmitBlock = async (formData: CreateBlockPayload) => {
		setBlockModalLoading(true);
		setError('');
		setFieldErrors({});
		try {
			const created = await createBlock(formData);
			if (created) setBlocks((prev) => [created, ...prev]);
			setBlockModalOpen(false);
			void swalSuccess('Guardado correcto', 'El bloqueo se guardó correctamente.');
		} catch (err) {
			setFieldErrors(extractFieldErrors(err));
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al guardar', msg);
		} finally {
			setBlockModalLoading(false);
		}
	};

	const handleDeleteBlock = async (id: number) => {
		const ok = await swalConfirm({
			title: 'Eliminar bloqueo',
			text: 'Esta acción no se puede deshacer.',
			icon: 'warning',
			confirmButtonText: 'Eliminar',
			cancelButtonText: 'Cancelar',
		});
		if (!ok) return;
		setDeletingBlockId(id);
		setError('');
		try {
			await deleteBlock(id);
			setBlocks((prev) => prev.filter((b) => b.id !== id));
			void swalSuccess('Eliminado', 'El bloqueo se eliminó correctamente.');
		} catch (err) {
			const msg = swalSilentErrorText(err);
			setError(msg);
			void swalError('Error al eliminar', msg);
		} finally {
			setDeletingBlockId(null);
		}
	};

	if (!authLoading && !user) return null;

	return (
		<>
			<WorkingHourFormModal
				open={hourModalOpen}
				onClose={() => {
					if (!hourModalLoading) {
						setFieldErrors({});
						setHourModalOpen(false);
						setSelectedHour(null);
					}
				}}
				onSubmit={handleSubmitHour}
				initialData={selectedHour}
				initialBlocks={
					selectedHour
						? hours
							.find(
								(h) =>
									(h.branch_id ?? null) === (selectedHour.branch_id ?? null) &&
									(h.professional_id ?? null) === (selectedHour.professional_id ?? null)
							)
							?.hours.map((b) => ({
								start_time: b.start_time,
								end_time: b.end_time,
							})) ?? null
						: null
				}
				loading={hourModalLoading}
				branches={branches}
				professionals={professionals}
				fieldErrors={fieldErrors}
			/>
			<BlockFormModal
				open={blockModalOpen}
				onClose={() => {
					if (!blockModalLoading) {
						setFieldErrors({});
						setBlockModalOpen(false);
					}
				}}
				onSubmit={handleSubmitBlock}
				loading={blockModalLoading}
				professionals={professionals}
				branches={branches}
				fieldErrors={fieldErrors}
			/>

			<>
				<PageHeader
					title="Horarios y disponibilidad"
					subtitle="Configura cuándo tu equipo puede recibir citas y bloquea fechas para vacaciones o descansos."
					action={
						activeTab === 'availability' ? (
							<Button type="button" onClick={openCreateHourModal} size="md">
								<span className="mr-2 text-base" aria-hidden>+</span>
								Nuevo horario
							</Button>
						) : (
							<Button type="button" onClick={openCreateBlockModal} size="md">
								<span className="mr-2 text-base" aria-hidden>+</span>
								Nuevo bloqueo
							</Button>
						)
					}
				/>

				<div
					role="tablist"
					aria-label="Secciones"
					className="mb-6 flex gap-1 rounded-2xl border border-white/[0.08] bg-slate-950/45 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
				>
					{TABS.map((tab) => {
						const count = tab.id === 'availability' ? filteredHours.length : filteredBlocks.length;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								role="tab"
								aria-selected={isActive}
								aria-controls={`panel-${tab.id}`}
								id={`tab-${tab.id}`}
								onClick={() => {
									setActiveTab(tab.id);
									setSearch('');
									router.replace(
										{ pathname: '/working-hours', query: tab.id === 'blocks' ? { tab: 'blocks' } : {} },
										undefined,
										{ shallow: true }
									);
								}}
								className={clsx(
									'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
									isActive
										? 'bg-teal-500/20 text-teal-300 shadow-sm ring-1 ring-teal-500/30'
										: 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
								)}
							>
								<span aria-hidden>{tab.icon}</span>
								{tab.label}
								<span
									className={clsx(
										'ml-1 min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
										isActive ? 'bg-teal-500/30 text-teal-200' : 'bg-white/[0.08] text-slate-400'
									)}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>

				<div
					className="page-filters"
					role="search"
					aria-label={activeTab === 'availability' ? 'Filtrar horarios' : 'Filtrar bloqueos'}
				>
					<SearchBar
						id="working-hours-search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={
							activeTab === 'availability'
								? 'Buscar por día o profesional...'
								: 'Buscar por profesional o motivo...'
						}
						className="min-w-0 flex-1"
					/>
					<p className="text-xs text-slate-500 tabular-nums sm:max-w-[12rem] sm:text-right">
						{activeTab === 'availability' &&
							(search.trim()
								? `${filteredHours.length} de ${hours.length} horarios`
								: `${hours.length} horario${hours.length === 1 ? '' : 's'}`)}
						{activeTab === 'blocks' &&
							(search.trim()
								? `${filteredBlocks.length} de ${blocks.length} bloqueos`
								: `${blocks.length} bloqueo${blocks.length === 1 ? '' : 's'}`)}
					</p>
				</div>

				{error && (
					<div className="mb-4">
						<Alert variant="error">{error}</Alert>
					</div>
				)}

				{isLoading ? (
					<PageLoading label="Cargando horarios y bloqueos..." />
				) : activeTab === 'availability' ? (
					<div
						id="panel-availability"
						role="tabpanel"
						aria-labelledby="tab-availability"
						className="min-w-0 space-y-5"
					>
						{filteredHours.length === 0 ? (
							<EmptyState
								icon="⏰"
								title={search.trim() ? 'No hay resultados' : 'Aún no hay horarios'}
								description={
									search.trim()
										? 'Prueba con otro término de búsqueda.'
										: 'Crea horarios por día y profesional para que la agenda sepa cuándo se pueden agendar citas.'
								}
								action={
									!search.trim() ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={openCreateHourModal}
										>
											Crear primer horario
										</Button>
									) : null
								}
							/>
						) : (
							<div className="space-y-5">
								{filteredHours.map((group, index) => (
									<article
										key={`${group.branch_id ?? 'none'}-${group.professional_id ?? 'sucursal'}-${index}`}
										className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/35 shadow-(--shadow-card) backdrop-blur-sm"
									>
										<header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 backdrop-blur-sm">
											<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
												<span className="font-medium text-slate-100">{group.professional_name}</span>
												{branches.length > 1 && (
													<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-white/[0.06]">
														{group.branch_name}
													</span>
												)}
											</div>

											<div className="flex items-center gap-2">
												<span className="text-xs text-slate-500">
													{group.weekdays.length} día
													{group.weekdays.length === 1 ? '' : 's'}
												</span>
												<FloatMenu
													placement="bottom-end"
													options={[
														{
															label: 'Editar',
															onClick: () => openEditHourModal(group),
														},
														{ divider: true },
														{
															label:
																deletingHourId != null &&
																group.hours.some((h) => h.ids.includes(deletingHourId))
																	? 'Eliminando…'
																	: 'Eliminar grupo',
															onClick: () => handleDeleteGroup(group),
															disabled:
																deletingHourId != null &&
																group.hours.some((h) => h.ids.includes(deletingHourId)),
														},
													]}
												>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="min-h-8 text-slate-400 hover:text-slate-200"
														aria-label="Acciones"
													>
														⋮
													</Button>
												</FloatMenu>
											</div>
										</header>

										<div className="p-4">
											<div className="mb-4 flex flex-wrap gap-2">
												{group.weekdays.map((weekday) => (
													<span
														key={weekday}
														className="rounded-full border border-white/[0.1] bg-slate-950/40 px-2.5 py-1 text-xs font-semibold text-slate-200"
													>
														{WEEKDAY_SHORT[weekday]}
													</span>
												))}
											</div>

											<ul className="space-y-2" aria-label="Bloques de tiempo">
												{group.hours.map((block) => (
													<li
														key={block.id}
														className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-950/35 px-3 py-2"
													>
														<span className="min-w-26 text-sm font-medium text-slate-200">
															{block.start_time} – {block.end_time}
														</span>
														<span
															className={clsx(
																'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
																block.is_active
																	? 'bg-emerald-500/15 text-emerald-300'
																	: 'bg-slate-700/80 text-slate-400'
															)}
														>
															<span
																className={clsx(
																	'h-1.5 w-1.5 rounded-full',
																	block.is_active ? 'bg-emerald-400' : 'bg-slate-500'
																)}
															/>
															{block.is_active ? 'Activo' : 'Inactivo'}
														</span>

														<div className="ml-auto">
															<FloatMenu
																placement="bottom-end"
																options={[
																	{
																		label: deletingHourId != null && block.ids.includes(deletingHourId)
																			? `Eliminando ${block.start_time}…`
																			: `Eliminar ${block.start_time}`,
																		onClick: () => handleDeleteHourIds(block.ids),
																		disabled:
																			deletingHourId != null && block.ids.includes(deletingHourId),
																	},
																]}
															>
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="min-h-8 text-slate-400 hover:text-slate-200"
																	aria-label="Acciones"
																>
																	⋮
																</Button>
															</FloatMenu>
														</div>
													</li>
												))}
											</ul>

											<div className="mt-3 text-xs text-slate-500">
												{group.hours[0]?.effective_from
													? formatDate(group.hours[0].effective_from)
													: 'Siempre'}
												{group.hours[0]?.effective_until
													? ` → ${formatDate(group.hours[0].effective_until)}`
													: ''}
											</div>
										</div>
									</article>
								))}
							</div>
						)}
					</div>
				) : (
					<div
						id="panel-blocks"
						role="tabpanel"
						aria-labelledby="tab-blocks"
						className="min-w-0"
					>
						{filteredBlocks.length === 0 ? (
							<EmptyState
								icon="🚫"
								title={search.trim() ? 'No hay bloqueos que coincidan' : 'Aún no hay bloqueos'}
								description={
									search.trim()
										? 'Prueba con otro término.'
										: 'Crea bloqueos para vacaciones, descansos o cierres y la agenda no ofrecerá citas en esas fechas.'
								}
								action={
									!search.trim() ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={openCreateBlockModal}
										>
											Crear bloqueo
										</Button>
									) : null
								}
							/>
						) : (
							<div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/35 shadow-(--shadow-card) backdrop-blur-sm">
								<Table<Block>
									columns={[
										{ key: 'professional', header: 'Profesional' },
										{ key: 'start', header: 'Inicio' },
										{ key: 'end', header: 'Fin' },
										{ key: 'type', header: 'Tipo' },
										{ key: 'reason', header: 'Motivo' },
										{ key: 'actions', header: 'Acciones', align: 'right' },
									]}
									items={filteredBlocks}
									getItemKey={(b) => b.id}
									renderCell={(b, key) => {
										const blockWithProfessional = b as Block & { professional?: { name: string } };
										const professional =
											blockWithProfessional.professional ??
											professionalById.get(b.professional_id ?? 0);
										if (key === 'professional') {
											return (
												<span className="text-sm font-medium text-slate-50">
													{professional?.name ?? 'General'}
												</span>
											);
										}
										if (key === 'start') {
											return (
												<span className="text-xs text-slate-400">{formatDateTime(b.start_at)}</span>
											);
										}
										if (key === 'end') {
											return (
												<span className="text-xs text-slate-400">{formatDateTime(b.end_at)}</span>
											);
										}
										if (key === 'type') {
											return <span className="text-xs text-slate-400">{b.type || '—'}</span>;
										}
										if (key === 'reason') {
											return <span className="text-xs text-slate-400">{b.reason || '—'}</span>;
										}
										if (key === 'actions') {
											return (
												<div className="flex justify-end">
													<FloatMenu
														placement="bottom-end"
														options={[
															{
																label: deletingBlockId === b.id ? 'Eliminando...' : 'Eliminar',
																onClick: () => handleDeleteBlock(b.id),
																disabled: deletingBlockId === b.id,
															},
														]}
													>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="min-h-[36px] text-slate-400 hover:text-slate-200"
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
							</div>
						)}
					</div>
				)}
			</>
		</>
	);
}
