import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { clientPhotoUrl } from '@/lib/api';
import { Button, Input, Textarea, Select, Modal, DatePicker } from '@/components/ui';
import type { Client } from '@/types';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { CreateClientPayload } from '@/lib/api/clients';

export interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload, photo?: File | null) => Promise<void>;
  initialData: Client | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function ClientFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: ClientFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [birthday, setBirthday] = useState(initialData?.birthday ?? '');
  const [gender, setGender] = useState(initialData?.gender ?? '');
  const [preferredStylist, setPreferredStylist] = useState(
    initialData?.preferred_stylist ?? ''
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [allergies, setAllergies] = useState(initialData?.allergies ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setEmail(initialData?.email ?? '');
      setPhone(initialData?.phone ?? '');
      setBirthday(initialData?.birthday ?? '');
      setGender(initialData?.gender ?? '');
      setPreferredStylist(initialData?.preferred_stylist ?? '');
      setNotes(initialData?.notes ?? '');
      setAllergies(initialData?.allergies ?? '');
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;
  const photoDisplay = photoPreview || clientPhotoUrl(initialData?.photo_url) || null;

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
    const payload: CreateClientPayload = {
      name,
      email: email || null,
      phone: phone || null,
      birthday: birthday || null,
      gender: gender || null,
      preferred_stylist: preferredStylist || null,
      notes: notes || null,
      allergies: allergies || null,
    };
    void onSubmit(payload, photoFile);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      description="Registra los datos básicos del cliente para ofrecerle una experiencia más personalizada."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <Input
              label="Nombre completo"
              id="client-name"
              required
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Nombre y apellidos del cliente"
              error={fieldErrors.name}
            />
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Foto del cliente
            </span>
            <div className="flex items-center gap-3">
              <label
                htmlFor="client-photo"
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
                id="client-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="client-photo"
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
          id="client-email"
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="cliente@correo.com"
          hint="Opcional, pero útil para recordatorios y marketing."
          error={fieldErrors.email}
        />

        <Input
          label="Teléfono"
          id="client-phone"
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          placeholder="+52 ..."
          error={fieldErrors.phone}
        />

        <DatePicker
          label="Cumpleaños"
          id="client-birthday"
          value={birthday || null}
          onChange={(_, dateStr) => setBirthday(dateStr || '')}
          error={fieldErrors.birthday}
        />

        <Select
          label="Género"
          id="client-gender"
          value={gender || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
          error={fieldErrors.gender}
        >
          <option value="">Sin especificar</option>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
          <option value="non-binary">No binario</option>
          <option value="other">Otro / Prefiere no decir</option>
        </Select>

        <Input
          label="Estilista / profesional preferido"
          id="client-preferred-stylist"
          value={preferredStylist}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredStylist(e.target.value)}
          placeholder="Nombre de la persona de confianza del cliente"
          error={fieldErrors.preferred_stylist}
        />

        <Textarea
          label="Notas internas"
          id="client-notes"
          rows={3}
          value={notes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Preferencias, detalles importantes, historial relevante..."
          error={fieldErrors.notes}
        />

        <Textarea
          label="Alergias / contraindicaciones"
          id="client-allergies"
          rows={3}
          value={allergies}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAllergies(e.target.value)}
          placeholder="Productos, ingredientes o tratamientos a evitar."
          error={fieldErrors.allergies}
        />

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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
