import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { Button, Input, Textarea, Modal } from '@/components/ui';
import type { FormFieldErrors } from '@/lib/formErrors';
import type { ServiceCategoryRecord, CategoryFormPayload } from './types';

export interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryFormPayload) => Promise<void>;
  initialData: ServiceCategoryRecord | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
  fieldErrors,
}: CategoryFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSubmit({ name, description: description || null });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      description="Organiza tus servicios en grupos claros (cortes, color, manos y pies, etc.)."
      size="md"
    >
      <form className="mt-1 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          id="category-name"
          required
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Cortes, Color, Manos y pies..."
          error={fieldErrors.name}
        />

        <Textarea
          label="Descripción (opcional)"
          id="category-description"
          rows={3}
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe qué tipos de servicios entran en esta categoría."
          error={fieldErrors.description}
        />

        <div className="form-divider flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
