import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '@/lib/api/serviceCategories';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState, Alert, PageHeader } from '@/components/ui';
import {
  CategoryFormModal,
  type ServiceCategoryRecord,
  type CategoryFormPayload,
} from '@/components/services/categories';
import type { AxiosError } from 'axios';

export default function ServiceCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [categories, setCategories] = useState<ServiceCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchServiceCategories();
        if (!cancelled) {
          setCategories(Array.isArray(data) ? (data as ServiceCategoryRecord[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar las categorías de servicio.'
          );
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => {
      const name = String(cat.name ?? '').toLowerCase();
      const description = String(cat.description ?? '').toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  }, [categories, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: ServiceCategoryRecord) => {
    setFieldErrors({});
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleSubmitCategory = async (formData: CategoryFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedCategory?.id) {
        const updated = await updateServiceCategory(
          selectedCategory.id,
          formData as unknown as Record<string, unknown>
        );
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id ? (updated as ServiceCategoryRecord) ?? cat : cat
          )
        );
      } else {
        const created = await createServiceCategory(
          formData as unknown as Record<string, unknown>
        );
        if (created) setCategories((prev) => [created as ServiceCategoryRecord, ...prev]);
      }
      setModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar la categoría. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteServiceCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar la categoría. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <>
      <CategoryFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedCategory(null);
          }
        }}
        onSubmit={handleSubmitCategory}
        initialData={selectedCategory}
        loading={modalLoading}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Categorías de servicio"
        subtitle="Agrupa tus servicios en secciones para que tu equipo encuentre todo rápido."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base">+</span>
            Nueva categoría
          </Button>
        }
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar categorías">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {search.trim()
            ? `${filteredCategories.length} de ${categories.length} categorías`
            : `${categories.length} categoría${categories.length === 1 ? '' : 's'}`}
        </p>
      </section>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/30">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/50 border-t-teal-400" />
            <span className="text-sm">Cargando categorías...</span>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon="🧩"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay categorías'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Crea categorías para organizar servicios (Cortes, Color, Manos y pies, etc.).'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800" onClick={openCreateModal}>
                Crear primera categoría
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<ServiceCategoryRecord>
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'description', header: 'Descripción' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredCategories}
          getItemKey={(cat) => cat.id}
          renderCell={(cat, key) => {
            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {cat.name}
                </span>
              );
            }

            if (key === 'description') {
              return (
                <span className="text-xs text-slate-400">
                  {cat.description || '—'}
                </span>
              );
            }

            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(cat) },
                      { divider: true },
                      {
                        label: deletingId === cat.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteCategory(cat.id),
                        disabled: deletingId === cat.id,
                      },
                    ]}
                  >
                    <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200" aria-label="Acciones">
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
    </>
  );
}
