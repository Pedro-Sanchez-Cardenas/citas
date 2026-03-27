import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import clsx from 'clsx';
import {
	Button,
	Input,
	Select,
	Checkbox,
	Modal,
	DatePicker,
} from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type {
	WorkingHourBlock,
	CreateWorkingHourPayload,
} from '@/components/working-hours/api/workingHours';
import type { Branch, Professional } from '@/types';
import { WEEKDAY_SHORT, TIME_PRESETS } from './utils';

type WorkingHourInitialData = WorkingHourBlock & {
	branch_id?: number | null;
	professional_id?: number | null;
	weekday?: number;
	weekdays?: number[];
};

export interface WorkingHourFormModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateWorkingHourPayload) => Promise<void>;
	initialData: WorkingHourInitialData | null;
	/** En edición: todos los bloques de tiempo existentes para ese día (weekday / sucursal / profesional). */
	initialBlocks?: { start_time?: string; end_time?: string }[] | null;
	loading: boolean;
	branches: Branch[];
	professionals: Professional[];
	fieldErrors: FormFieldErrors;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="col-span-full text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
			{children}
		</h3>
	);
}

export function WorkingHourFormModal({
	open,
	onClose,
	onSubmit,
	initialData,
	initialBlocks,
	loading,
	branches,
	professionals,
	fieldErrors,
}: WorkingHourFormModalProps) {
	// El input `type="time"` acepta HH:MM, pero en BD guardamos HH:MM:SS.
	const toHHMM = (time?: string | null) => (time ? String(time).slice(0, 5) : '');

	const [branchId, setBranchId] = useState<string | number>(initialData?.branch_id ?? '');
	/** Múltiples días seleccionados (0=Dom … 6=Sáb). */
	const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
		initialData?.weekdays?.length
			? initialData.weekdays
			: initialData?.weekday != null
				? [initialData.weekday]
				: [1, 2, 3, 4, 5]
	);
	/** Bloques horarios en el día: permite mañana/tarde, etc. */
	const [timeBlocks, setTimeBlocks] = useState<{ start: string; end: string }[]>(() => {
		if (initialBlocks && initialBlocks.length > 0) {
			return initialBlocks
				.filter((b) => b.start_time && b.end_time)
				.map((b) => ({ start: toHHMM(b.start_time), end: toHHMM(b.end_time) }))
				.sort((a, b) => a.start.localeCompare(b.start));
		}
		if (initialData?.start_time && initialData?.end_time) {
			return [{ start: toHHMM(initialData.start_time), end: toHHMM(initialData.end_time) }];
		}
		return [{ start: '09:00', end: '18:00' }];
	});
	const [professionalId, setProfessionalId] = useState(
		initialData?.professional_id ?? ''
	);
	const [effectiveFrom, setEffectiveFrom] = useState(
		initialData?.effective_from ?? ''
	);
	const [effectiveUntil, setEffectiveUntil] = useState(
		initialData?.effective_until ?? ''
	);
	const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
	const [showVigencia, setShowVigencia] = useState(
		!!(initialData?.effective_from || initialData?.effective_until)
	);

	useEffect(() => {
		if (open) {
			const defaultBranch =
				initialData?.branch_id ??
				(branches.length === 1 ? branches[0]?.id : '');
			setBranchId(defaultBranch);
			setSelectedWeekdays(
				initialData?.weekdays?.length
					? initialData.weekdays
					: initialData?.weekday != null
						? [initialData.weekday]
						: [1, 2, 3, 4, 5]
			);
			if (initialBlocks && initialBlocks.length > 0) {
				const blocks = initialBlocks
					.filter((b) => b.start_time && b.end_time)
					.map((b) => ({ start: toHHMM(b.start_time), end: toHHMM(b.end_time) }))
					.sort((a, b) => a.start.localeCompare(b.start));
				setTimeBlocks(blocks);
			} else {
				setTimeBlocks(
					initialData?.start_time && initialData?.end_time
						? [{ start: toHHMM(initialData.start_time), end: toHHMM(initialData.end_time) }]
						: [{ start: '09:00', end: '18:00' }]
				);
			}
			setProfessionalId(initialData?.professional_id ?? '');
			setEffectiveFrom(initialData?.effective_from ?? '');
			setEffectiveUntil(initialData?.effective_until ?? '');
			setIsActive(initialData?.is_active ?? true);
			setShowVigencia(!!(initialData?.effective_from || initialData?.effective_until));
		}
	}, [open, initialData, initialBlocks, branches]);

	const isEdit = !!initialData?.id;

	const applyPreset = (start: string, end: string) => {
		// Aplicamos el preset al primer bloque para mantener la UI simple.
		setTimeBlocks((prev) => {
			if (prev.length === 0) return [{ start, end }];
			const next = [...prev];
			next[0] = { start, end };
			return next;
		});
	};

	const toggleWeekday = (index: number) => {
		setSelectedWeekdays((prev) =>
			prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index].sort((a, b) => a - b)
		);
	};

	const selectAllWeekdays = () => {
		setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
	};

	const selectWeekdays = () => {
		setSelectedWeekdays([1, 2, 3, 4, 5]);
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const base: Omit<CreateWorkingHourPayload, 'weekday' | 'hours'> = {
			branch_id: branchId !== '' ? Number(branchId) : null,
			professional_id: professionalId ? Number(professionalId) : null,
			effective_from: effectiveFrom || null,
			effective_until: effectiveUntil || null,
			is_active: !!isActive,
		};

		// Validaciones mínimas
		if (timeBlocks.length === 0) return;
		if (selectedWeekdays.length === 0) return;

		// Enviamos siempre un único payload donde:
		// - `weekday` es un array de días seleccionados
		// - `hours` es un array con todos los bloques horarios
		const payload: CreateWorkingHourPayload = {
			...base,
			weekday: selectedWeekdays,
			hours: timeBlocks.map((block) => ({
				start_time: block.start,
				end_time: block.end,
			})),
		};

		void onSubmit(payload);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={isEdit ? 'Editar horario' : 'Nuevo horario de atención'}
			description="Define en qué día y franja horaria hay disponibilidad para citas. Puedes asignar el horario a una sucursal o a un profesional concreto."
			size="lg"
		>
			<form
				className="mt-4 flex flex-col gap-6"
				onSubmit={handleSubmit}
			>
				{/* Dónde y para quién */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<SectionTitle>Dónde y para quién</SectionTitle>
					<Select
						label="Sucursal"
						id="wh-branch"
						value={String(branchId)}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
						error={fieldErrors.branch_id}
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
						label="Profesional"
						id="wh-professional"
						value={String(professionalId)}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(e.target.value)}
						error={fieldErrors.professional_id}
					>
						<option value="">Horario de toda la sucursal</option>
						{professionals.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</Select>
				</div>

				{/* Días de la semana */}
				<div className="space-y-3">
					<SectionTitle>Días de la semana</SectionTitle>
					<p className="text-[13px] text-slate-400">
						Elige uno o varios días. Se creará o actualizará el mismo horario para cada día seleccionado.
					</p>
					<div
						className="flex flex-wrap items-center gap-2"
						role="group"
						aria-label="Días de la semana"
					>
						{WEEKDAY_SHORT.map((label, index) => (
							<button
								key={index}
								type="button"
								onClick={() => toggleWeekday(index)}
								className={clsx(
									'min-w-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
									selectedWeekdays.includes(index)
										? 'border-teal-400/50 bg-teal-500/20 text-teal-100 shadow-[0_0_20px_-8px_rgba(45,212,191,0.35)]'
										: 'border-white/[0.1] bg-white/[0.05] text-slate-400 hover:border-white/[0.15] hover:text-slate-200',
								)}
							>
								{label}
							</button>
						))}
						<>
							<span className="mx-1 text-slate-500" aria-hidden>|</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-slate-400 hover:text-slate-200"
								onClick={selectWeekdays}
							>
								Lun–Vie
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-slate-400 hover:text-slate-200"
								onClick={selectAllWeekdays}
							>
								Todos
							</Button>
						</>
					</div>
					{selectedWeekdays.length === 0 && (
						<p className="text-xs text-amber-400" role="alert">
							Selecciona al menos un día.
						</p>
					)}
					{fieldErrors.weekday && (
						<p className="text-xs text-red-400" role="alert">
							{fieldErrors.weekday}
						</p>
					)}
				</div>

				{/* Horario (de - a) + presets + múltiples bloques */}
				<div className="space-y-3">
					<SectionTitle>Horario de atención</SectionTitle>
					<p className="text-[13px] text-slate-400">
						Define una o varias franjas en las que se pueden agendar citas este día. Por ejemplo:
						{' '}
						mañana y tarde.
					</p>
					<div className="space-y-2">
						{timeBlocks.map((block, index) => (
							<div
								key={index}
								className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
							>
								<div className="flex flex-1 items-end gap-2">
									<Input
										label={index === 0 ? 'Desde' : `Desde (bloque ${index + 1})`}
										id={`wh-start-time-${index}`}
										type="time"
										required
										value={block.start}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setTimeBlocks((prev) => {
												const next = [...prev];
												next[index] = { ...next[index], start: e.target.value };
												return next;
											})
										}
										error={fieldErrors[`hours.${index}.start_time`]}
										inputClassName="rounded-xl"
									/>
									<span className="mb-2.5 hidden text-slate-500 sm:inline" aria-hidden>
										a
									</span>
									<Input
										label={index === 0 ? 'Hasta' : `Hasta (bloque ${index + 1})`}
										id={`wh-end-time-${index}`}
										type="time"
										required
										value={block.end}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setTimeBlocks((prev) => {
												const next = [...prev];
												next[index] = { ...next[index], end: e.target.value };
												return next;
											})
										}
										error={fieldErrors[`hours.${index}.end_time`]}
										inputClassName="rounded-xl"
									/>
								</div>
								<div className="flex items-center gap-2 sm:shrink-0">
									{index === 0 && (
										<div className="flex flex-wrap gap-2">
											{TIME_PRESETS.map((preset) => (
												<Button
													key={preset.label}
													type="button"
													variant="subtle"
													size="sm"
													className="text-slate-400 hover:text-slate-200"
													onClick={() => applyPreset(preset.start, preset.end)}
												>
													{preset.label}
												</Button>
											))}
										</div>
									)}
									{timeBlocks.length > 1 && index > 0 && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="ml-1 text-slate-500 hover:text-red-300"
											onClick={() =>
												setTimeBlocks((prev) =>
													prev.filter((_, i) => i !== index)
												)
											}
											aria-label={`Quitar bloque ${index + 1}`}
										>
											✕
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
					<div className="flex items-center justify-between">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-teal-300 hover:text-teal-100"
							onClick={() =>
								setTimeBlocks((prev) => [
									...prev,
									{
										start: prev[prev.length - 1]?.end ?? '09:00',
										end: prev[prev.length - 1]?.end ?? '18:00',
									},
								])
							}
						>
							+ Agregar otro bloque
						</Button>
					</div>
				</div>

				{/* Vigencia opcional */}
				<div className="space-y-3">
					<button
						type="button"
						onClick={() => setShowVigencia((v) => !v)}
						className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
					>
						<span aria-hidden>{showVigencia ? '▼' : '▶'}</span>
						Vigencia (opcional)
					</button>
					{showVigencia && (
						<div className="surface-inset grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
							<DatePicker
								label="Válido desde"
								id="wh-effective-from"
								value={effectiveFrom || null}
								onChange={(_, dateStr) => setEffectiveFrom(dateStr || '')}
								error={fieldErrors.effective_from}
							/>
							<DatePicker
								label="Válido hasta"
								id="wh-effective-until"
								value={effectiveUntil || null}
								onChange={(_, dateStr) => setEffectiveUntil(dateStr || '')}
								error={fieldErrors.effective_until}
							/>
							<p className="col-span-full text-[12px] text-slate-500">
								Deja vacío para que el horario aplique siempre.
							</p>
						</div>
					)}
				</div>

				{/* Activo */}
				<div className="form-divider">
					<Checkbox
						id="wh-is-active"
						checked={!!isActive}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
						label="Horario activo (la agenda tendrá en cuenta este horario)"
					/>
					{fieldErrors.is_active && (
						<p className="mt-2 text-[11px] text-red-300" role="alert">
							{fieldErrors.is_active}
						</p>
					)}
				</div>

				<div className="form-divider flex items-center justify-end gap-2">
					<Button type="button" variant="subtle" size="sm" onClick={onClose}>
						Cancelar
					</Button>
					<Button
						type="submit"
						size="sm"
						disabled={loading || (!isEdit && selectedWeekdays.length === 0)}
					>
						{loading
							? 'Guardando...'
							: isEdit
								? 'Guardar cambios'
								: 'Crear horario'}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
