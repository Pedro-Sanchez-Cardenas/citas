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
import type { WorkingHour, CreateWorkingHourPayload } from '@/lib/api/workingHours';
import type { Branch, Professional } from '@/types';
import { WEEKDAY_SHORT, TIME_PRESETS } from './utils';

export interface WorkingHourFormModalProps {
	open: boolean;
	onClose: () => void;
	/** Al crear con varios días se puede enviar un array (un horario por día). Al editar siempre es un solo payload. */
	onSubmit: (payload: CreateWorkingHourPayload | CreateWorkingHourPayload[]) => Promise<void>;
	initialData: WorkingHour | null;
	loading: boolean;
	branches: Branch[];
	professionals: Professional[];
	fieldErrors: FormFieldErrors;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<h3 className="col-span-full text-xs font-semibold uppercase tracking-wider text-slate-500">
			{children}
		</h3>
	);
}

export function WorkingHourFormModal({
	open,
	onClose,
	onSubmit,
	initialData,
	loading,
	branches,
	professionals,
	fieldErrors,
}: WorkingHourFormModalProps) {
	const [branchId, setBranchId] = useState<string | number>(initialData?.branch_id ?? '');
	/** Múltiples días seleccionados (0=Dom … 6=Sáb). En edición solo hay uno. */
	const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
		initialData?.weekday != null ? [initialData.weekday] : [1, 2, 3, 4, 5]
	);
	const [startTime, setStartTime] = useState(initialData?.start_time ?? '09:00');
	const [endTime, setEndTime] = useState(initialData?.end_time ?? '18:00');
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
				initialData?.weekday != null ? [initialData.weekday] : [1, 2, 3, 4, 5]
			);
			setStartTime(initialData?.start_time ?? '09:00');
			setEndTime(initialData?.end_time ?? '18:00');
			setProfessionalId(initialData?.professional_id ?? '');
			setEffectiveFrom(initialData?.effective_from ?? '');
			setEffectiveUntil(initialData?.effective_until ?? '');
			setIsActive(initialData?.is_active ?? true);
			setShowVigencia(!!(initialData?.effective_from || initialData?.effective_until));
		}
	}, [open, initialData, branches]);

	const isEdit = !!initialData?.id;

	const applyPreset = (start: string, end: string) => {
		setStartTime(start);
		setEndTime(end);
	};

	const toggleWeekday = (index: number) => {
		if (isEdit) return;
		setSelectedWeekdays((prev) =>
			prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index].sort((a, b) => a - b)
		);
	};

	const selectAllWeekdays = () => {
		if (isEdit) return;
		setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
	};

	const selectWeekdays = () => {
		if (isEdit) return;
		setSelectedWeekdays([1, 2, 3, 4, 5]);
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const base: Omit<CreateWorkingHourPayload, 'weekday'> = {
			branch_id: branchId !== '' ? Number(branchId) : null,
			start_time: startTime,
			end_time: endTime,
			professional_id: professionalId ? Number(professionalId) : null,
			effective_from: effectiveFrom || null,
			effective_until: effectiveUntil || null,
			is_active: !!isActive,
		};
		if (isEdit) {
			void onSubmit({ ...base, weekday: selectedWeekdays[0] } as CreateWorkingHourPayload);
			return;
		}
		if (selectedWeekdays.length === 0) return;
		if (selectedWeekdays.length === 1) {
			void onSubmit({ ...base, weekday: selectedWeekdays[0] } as CreateWorkingHourPayload);
			return;
		}
		const payloads: CreateWorkingHourPayload[] = selectedWeekdays.map((weekday) => ({
			...base,
			weekday,
		}));
		void onSubmit(payloads);
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

        {/* Días de la semana (múltiple en creación, fijo en edición) */}
        <div className="space-y-3">
          <SectionTitle>Días de la semana</SectionTitle>
          <p className="text-[13px] text-slate-400">
            {isEdit
              ? 'Este horario aplica al día indicado (en edición no se pueden cambiar los días).'
              : 'Elige uno o varios días. Se creará el mismo horario para cada día seleccionado.'}
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
                onClick={() => (isEdit ? null : toggleWeekday(index))}
                disabled={isEdit}
                className={clsx(
                  'min-w-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  selectedWeekdays.includes(index)
                    ? 'border-teal-500/60 bg-teal-500/20 text-teal-300'
                    : 'border-slate-700/80 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                  isEdit && 'cursor-default opacity-90'
                )}
              >
                {label}
              </button>
            ))}
            {!isEdit && (
              <>
                <span className="mx-1 text-slate-600" aria-hidden>|</span>
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
            )}
          </div>
          {!isEdit && selectedWeekdays.length === 0 && (
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

				{/* Horario (de - a) + presets */}
				<div className="space-y-3">
					<SectionTitle>Horario de atención</SectionTitle>
					<p className="text-[13px] text-slate-400">
						Franja en la que se pueden agendar citas este día.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
						<div className="flex flex-1 items-end gap-2">
							<Input
								label="Desde"
								id="wh-start-time"
								type="time"
								required
								value={startTime}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
								error={fieldErrors.start_time}
								inputClassName="rounded-xl"
							/>
							<span className="mb-2.5 hidden text-slate-500 sm:inline" aria-hidden>
								a
							</span>
							<Input
								label="Hasta"
								id="wh-end-time"
								type="time"
								required
								value={endTime}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
								error={fieldErrors.end_time}
								inputClassName="rounded-xl"
							/>
						</div>
						<div className="flex flex-wrap gap-2 sm:shrink-0">
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
						<div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 md:grid-cols-2">
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
				<div className="border-t border-slate-700/60 pt-4">
					<Checkbox
						id="wh-is-active"
						checked={!!isActive}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
						label="Horario activo (la agenda tendrá en cuenta este horario)"
					/>
				</div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-700/60 pt-4">
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
                : selectedWeekdays.length > 1
                  ? `Crear ${selectedWeekdays.length} horarios`
                  : 'Crear horario'}
          </Button>
        </div>
			</form>
		</Modal>
	);
}
