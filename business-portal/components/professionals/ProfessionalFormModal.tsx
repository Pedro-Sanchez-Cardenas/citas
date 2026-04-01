import clsx from 'clsx';
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
    /** True si existe usuario worker ligado (login con este correo). */
    has_worker_user?: boolean;
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
    const [createWorkerUser, setCreateWorkerUser] = useState(!initialData?.id);
    const [updateWorkerCredentials, setUpdateWorkerCredentials] = useState(
        () => Boolean(initialData?.id && (initialData as ProfessionalWithExtras).has_worker_user)
    );
    const [workerPassword, setWorkerPassword] = useState('');
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
            setCreateWorkerUser(!initialData?.id);
            setUpdateWorkerCredentials(!!data?.has_worker_user);
            setWorkerPassword('');
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
    const hasWorkerUser = Boolean(data?.has_worker_user);

    const generatePassword = () => {
        const charset =
            'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?';
        const length = 14;

        try {
            const values = new Uint32Array(length);
            crypto.getRandomValues(values);
            const out = Array.from(values)
                .map((v) => charset[v % charset.length])
                .join('');
            setWorkerPassword(out);
        } catch {
            const out = Array.from({ length })
                .map(() => charset[Math.floor(Math.random() * charset.length)])
                .join('');
            setWorkerPassword(out);
        }
    };

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
            email: !isEdit
                ? createWorkerUser
                    ? email.trim() || null
                    : null
                : updateWorkerCredentials
                  ? email.trim() || null
                  : undefined,
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
            create_worker_user: !isEdit ? createWorkerUser : undefined,
            update_worker_credentials: isEdit ? updateWorkerCredentials : undefined,
            worker_password:
                (!isEdit && createWorkerUser) || (isEdit && updateWorkerCredentials)
                    ? workerPassword
                    : undefined,
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
                                className="avatar-upload"
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
                                {fieldErrors.photo && (
                                    <p className="text-[11px] text-red-300" role="alert">
                                        {fieldErrors.photo}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!isEdit && (
                    <div className="md:col-span-2 flex flex-col gap-3">
                        <Checkbox
                            checked={createWorkerUser}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const checked = e.target.checked;
                                setCreateWorkerUser(checked);
                                if (!checked) {
                                    setEmail('');
                                    setWorkerPassword('');
                                }
                            }}
                            label="Crear cuenta worker para este profesional"
                        />

                        {createWorkerUser && (
                            <div className="flex flex-col gap-3">
                                <Input
                                    label="Correo electrónico"
                                    id="professional-email"
                                    type="email"
                                    value={email}
                                    required={createWorkerUser}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="equipo@salon.com"
                                    error={fieldErrors.email}
                                />

                                <Input
                                    label="Contraseña del worker"
                                    id="professional-worker-password"
                                    type="text"
                                    value={workerPassword}
                                    required={createWorkerUser}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setWorkerPassword(e.target.value)
                                    }
                                    error={fieldErrors.worker_password}
                                    placeholder="Escribe una contraseña o genérala"
                                    hint="Puedes escribir tu propia contraseña o generar una automáticamente."
                                />

                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        size="sm"
                                        onClick={generatePassword}
                                    >
                                        Generar contraseña
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isEdit && (
                    <div className="md:col-span-2 flex flex-col gap-3">
                        <Checkbox
                            checked={updateWorkerCredentials}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const checked = e.target.checked;
                                setUpdateWorkerCredentials(checked);
                                if (!checked) setWorkerPassword('');
                            }}
                            label={
                                hasWorkerUser
                                    ? 'Actualizar credenciales del worker (correo y contraseña)'
                                    : 'Definir credenciales del worker (correo y contraseña)'
                            }
                        />

                        {updateWorkerCredentials && (
                            <div className="flex flex-col gap-3">
                                <Input
                                    label="Correo electrónico (login worker)"
                                    id="professional-email-edit"
                                    type="email"
                                    value={email}
                                    required={hasWorkerUser}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    placeholder="equipo@salon.com"
                                    error={fieldErrors.email}
                                    hint={
                                        hasWorkerUser
                                            ? 'Este correo es el usuario de acceso del worker; es obligatorio mientras exista la cuenta.'
                                            : 'Opcional si aún no hay cuenta worker; necesario si crearás o enlazarás el acceso.'
                                    }
                                />

                                <Input
                                    label="Contraseña del worker"
                                    id="professional-worker-password-edit"
                                    type="text"
                                    value={workerPassword}
                                    required={updateWorkerCredentials}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setWorkerPassword(e.target.value)
                                    }
                                    error={fieldErrors.worker_password}
                                    placeholder="Escribe una contraseña o genérala"
                                    hint="Se guarda junto con el correo cuando esta sección está activa."
                                />

                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        size="sm"
                                        onClick={generatePassword}
                                    >
                                        Generar contraseña
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Input
                    label="Teléfono"
                    id="professional-phone"
                    value={phone}
                    required
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
                            className={clsx(
                                'h-9 w-12 cursor-pointer rounded-lg border border-white/[0.12] bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
                                fieldErrors.color ? 'border-red-500/80 bg-red-950/30' : ''
                            )}
                        />
                        <span className="text-xs text-slate-400">
                            Usa un color distintivo para identificar rápidamente a la persona en la agenda.
                        </span>
                    </div>
                    {fieldErrors.color && (
                        <p className="mt-1 text-[11px] text-red-300" role="alert">
                            {fieldErrors.color}
                        </p>
                    )}
                </div>

                <Input
                    label="Comisión (%)"
                    id="professional-commission"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={commissionRate}
                    required
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
                    required
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBaseSalary(e.target.value)}
                    placeholder="Ej. 8000.00"
                    hint="Opcional. Se guarda en la base de datos en centavos."
                    error={fieldErrors.base_salary_cents}
                />

                <div className="md:col-span-2 flex flex-col gap-1 pt-2">
                    <div className="flex items-center justify-between">
                        <Checkbox
                            checked={!!isActive}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
                            label="Profesional activo (aparece para agendar citas)"
                        />
                    </div>
                    {fieldErrors.is_active && (
                        <p className="text-[11px] text-red-300" role="alert">
                            {fieldErrors.is_active}
                        </p>
                    )}
                </div>

                <div className="form-divider mt-2 flex flex-wrap items-center justify-end gap-2 md:col-span-2">
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
