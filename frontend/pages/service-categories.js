import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
} from '@/lib/api/serviceCategories';
import { Button, Input, Textarea, Modal, Table } from '@/components/ui';

function CategoryFormModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      description="Organiza tus servicios en grupos claros (cortes, color, manos y pies, etc.)."
      size="md"
    >
      <form
        className="mt-1 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, description });
        }}
      >
        <Input
          label="Nombre"
          id="category-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cortes, Color, Manos y pies..."
        />

        <Textarea
          label="Descripción (opcional)"
          id="category-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe qué tipos de servicios entran en esta categoría."
        />

        <div className="mt-4 flex items-center justify-end gap-2">
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

export default function ServiceCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar las categorías de servicio.'
          );
          if (err?.response?.status === 401) {
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
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleSubmitCategory = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedCategory?.id) {
        const updated = await updateServiceCategory(selectedCategory.id, formData);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === selectedCategory.id ? updated ?? cat : cat))
        );
      } else {
        const created = await createServiceCategory(formData);
        setCategories((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar la categoría. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteServiceCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
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
    <DashboardLayout user={user} onLogout={logout}>
      <CategoryFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedCategory(null);
          }
        }}
        onSubmit={handleSubmitCategory}
        initialData={selectedCategory}
        loading={modalLoading}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Categorías de servicio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Agrupa tus servicios en secciones claras para que tu equipo encuentre todo rápido.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nueva categoría
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredCategories.length} categoría
          {filteredCategories.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando categorías...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            🧩
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes categorías creadas
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Crea tus primeras categorías para organizar tus servicios (por ejemplo: Cortes,
            Color, Manos y pies, tratamientos, etc.).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear categoría
          </Button>
        </div>
      ) : (
        <Table
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
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => openEditModal(cat)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => handleDeleteCategory(cat.id)}
                    disabled={deletingId === cat.id}
                  >
                    {deletingId === cat.id ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              );
            }

            return null;
          }}
        />
      )}
    </DashboardLayout>
  );
}

