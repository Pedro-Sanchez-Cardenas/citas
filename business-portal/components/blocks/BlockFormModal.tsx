import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Select, Modal, Textarea, DatePicker } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { CreateBlockPayload } from '@/lib/api/blocks';
import type { Professional, Branch } from '@/types';

export interface BlockFormModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateBlockPayload) => Promise<void>;
	loading: boolean;
	professionals: Professional[];
	branches: Branch[];
	fieldErrors: FormFieldErrors;
}

export function BlockFormModal({
	open,
	onClose,
	onSubmit,
	loading,
	professionals,
	branches,
	fieldErrors,
}: BlockFormModalProps) {
	const [professionalId, setProfessionalId] = useState<number | null>(null);
	const [branchId, setBranchId] = useState<number | null>(null);
	const [dates, setDates] = useState<Date[] | null>(null);
	const [reason, setReason] = useState('');
	const [type, setType] = useState('block');

	useEffect(() => {
		if (open) {
			setProfessionalId(null);
			setBranchId(null);
			setDates(null);
			setReason('');
			setType('block');
		}
	}, [open]);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const payload: CreateBlockPayload = {
			professional_id: professionalId ? Number(professionalId) : null,
			branch_id: branchId ? Number(branchId) : null,
			reason: reason || null,
			type: type || null,
			dates: dates ? dates : null,
		};
		void onSubmit(payload);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Bloquear horario"
			description="Crea un bloqueo de tiempo en la agenda (descanso, mantenimiento, evento interno, etc.)."
			size="md"
		>
			<form className="mt-1 space-y-4" onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					<Select
						label="Sucursal"
						id="block-branch"
						value={branchId ?? ''}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(Number(e.target.value))}
						error={fieldErrors.branch_id}
					>
						<option value="">Selecciona sucursal</option>
						{branches.map((b) => (
							<option key={b.id} value={b.id}>
								{b.name}
							</option>
						))}
					</Select>

					<Select
						label="Profesional (opcional)"
						id="block-professional"
						value={professionalId ?? ''}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfessionalId(Number(e.target.value))}
						error={fieldErrors.professional_id}
					>
						<option value="">Bloqueo general</option>
						{professionals.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</Select>
				</div>

				<DatePicker
					label="Vigencia"
					id="block-vigency"
					mode="range"
					required
					value={dates ?? null}
					onChange={(value) => {
						// En mode="range" Flatpickr devuelve un array de 0..2 fechas.
						if (Array.isArray(value)) {
							setDates(value.length === 0 ? null : value);
							return;
						}
						// Compatibilidad: si algún caso devuelve Date o null.
						setDates(value ? [value] : null);
					}}
					error={
						fieldErrors.start_at ||
						fieldErrors.end_at ||
						fieldErrors['dates.0'] ||
						fieldErrors['dates.1'] ||
						fieldErrors.dates
					}
				/>

				<Input
					label="Tipo"
					id="block-type"
					value={type}
					onChange={(e: ChangeEvent<HTMLInputElement>) => setType(e.target.value)}
					placeholder="descanso, mantenimiento, cierre, etc."
					error={fieldErrors.type}
				/>

				<Textarea
					label="Motivo"
					id="block-reason"
					rows={3}
					value={reason}
					onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
					placeholder="Detalles del motivo del bloqueo."
					error={fieldErrors.reason}
				/>

				<div className="form-divider mt-2 flex flex-wrap items-center justify-end gap-2">
					<Button type="button" variant="subtle" size="sm" onClick={onClose}>
						Cancelar
					</Button>
					<Button type="submit" size="sm" disabled={loading}>
						{loading ? 'Guardando...' : 'Crear bloqueo'}
					</Button>
				</div>
			</form>
		</Modal >
	);
}
