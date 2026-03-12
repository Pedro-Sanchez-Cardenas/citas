import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { clientPhotoUrl } from '@/lib/api';
import { Button, Input, Select, Checkbox, Modal } from '@/components/ui';
import type { Professional, Branch } from '@/types';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { ProfessionalFormPayload } from './types';

export interface ProfessionalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ProfessionalFormPayload, photo?: File | null) => Promise<void>;
  initialData: Professional | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
  branches: Branch[];
}

type ProfessionalWithExtras = Professional & {
  email?: string;
  phone?: string;
  color?: string;
  commission_rate?: number;
  base_salary_cents?: number;
  is_active?: boolean;
  branch_id?: number;
  photo_url?: string | null;
};

export function ProfessionalFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
  branches,
}: ProfessionalFormModalProps) {
  const data = initialData as ProfessionalWithExtras | null;

  const [branchId, setBranchId] = useState<string | number>(data?.branch_id ?? '');
  const [name, setName] = useState(data?.name ?? '');
  const [email, setEmail] = useState(data?.email ?? '');
  const [phone, setPhone] = useState(data?.phone ?? '');
  const [color, setColor] = useState(data?.color ?? '#22c55e');
  const [commissionRate, setCommissionRate] = useState(
    data?.commission_rate != null ? String(data.commission_rate) : ''
  );
  const [baseSalary, setBaseSalary] = useState(
    data?.base_salary_cents != null ? String((data.base_salary_cents ?? 0) / 100) : ''
  );
  const [isActive, setIsActive] = useState(data?.is_active ?? true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const defaultBranch =
        data?.branch_id ?? (branches.length === 1 ? branches[0].id : '');
      setBranchId(defaultBranch);
      setName(data?.name ?? '');
      setEmail(data?.email ?? '');
      setPhone(data?.phone ?? '');
      setColor(data?.color ?? '#22c55e');
      setCommissionRate(
        data?.commission_rate != null ? String(data.commission_rate) : ''
      );
      setBaseSalary(
        data?.base_salary_cents != null ? String(data.base_salary_cents / 100) : ''
      );
      setIsActive(data?.is_active ?? true);
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, initialData, branches]);

  const isEdit = !!initialData?.id;
  const showBranchSelect = branches.length > 1;
  const effectiveBranchId =
    showBranchSelect ? Number(branchId) : (branches[0]?.id ?? Number(branchId));
  const photoDisplay = photoPreview || clientPhotoUrl(data?.photo_url) || null;

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: ProfessionalFormPayload = {
      branch_id: effectiveBranchId,
      name,
      email: email || null,
      phone: phone || null,
      color: color || null,
      commission_rate:
        commissionRate && !Number.isNaN(Number(commissionRate))
          ? Number(commissionRate)
          : null,
      base_salary_cents:
        baseSalary && !Number.isNaN(Number(baseSalary))
          ? Math.round(Number(baseSalary) * 100)
          : null,
      is_active: !!isActive,
    };
    void onSubmit(payload, photoFile);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar profesional' : 'Nuevo profesional'}
      description="Administra a las personas de tu equipo: datos de contacto, color en la agenda y condiciones económicas."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        {showBranchSelect && (
          <Select
            label="Sucursal"
            id="professional-branch"
            value={String(branchId)}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
            required
            error={fieldErrors.branch_id}
          >
            <option value="">Selecciona una sucursal</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}

        <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <Input
              label="Nombre del profesional"
              id="professional-name"
              required
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Nombre y apellidos"
              error={fieldErrors.name}
            />
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Foto
            </span>
            <div className="flex items-center gap-3">
              <label
                htmlFor="professional-photo"
                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-600 bg-slate-800/60 transition hover:border-slate-500 hover:bg-slate-800/80"
              >
                {photoDisplay ? (
                  <img
                    src={photoDisplay}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-slate-500">👤</span>
                )}
              </label>
              <input
                id="professional-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="professional-photo"
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  {photoDisplay ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <p className="text-[11px] text-slate-500">JPG, PNG o WebP. Máx. 5 MB</p>
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Correo electrónico"
          id="professional-email"
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="equipo@salon.com"
          error={fieldErrors.email}
        />

        <Input
          label="Teléfono"
          id="professional-phone"
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          placeholder="+52 ..."
          error={fieldErrors.phone}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Color en agenda
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color || '#22c55e'}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-slate-900"
            />
            <span className="text-xs text-slate-400">
              Usa un color distintivo para identificar rápidamente a la persona en la agenda.
            </span>
          </div>
        </div>

        <Input
          label="Comisión (%)"
          id="professional-commission"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={commissionRate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCommissionRate(e.target.value)}
          placeholder="Ej. 40"
          hint="Porcentaje de comisión sobre los servicios realizados."
          error={fieldErrors.commission_rate}
        />

        <Input
          label="Salario base (mensual)"
          id="professional-base-salary"
          type="number"
          min={0}
          step="0.01"
          value={baseSalary}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBaseSalary(e.target.value)}
          placeholder="Ej. 8000.00"
          hint="Opcional. Se guarda en la base de datos en centavos."
          error={fieldErrors.base_salary_cents}
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Profesional activo (aparece para agendar citas)"
          />
        </div>

        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear profesional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
