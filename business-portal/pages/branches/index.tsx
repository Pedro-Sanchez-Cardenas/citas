import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type BranchPayload,
} from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState, Alert, PageHeader } from '@/components/ui';
import { BranchFormModal } from '@/components/branches/BranchFormModal';
import type { Branch } from '@/types';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function BranchesPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
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
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchBranches();
        if (!cancelled) {
          setBranches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar las sucursales. Vuelve a intentarlo.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => {
      const name = String(b.name ?? '').toLowerCase();
      const code = String((b as any).code ?? '').toLowerCase();
      const city = String((b as any).city ?? '').toLowerCase();
      return name.includes(q) || code.includes(q) || city.includes(q);
    });
  }, [branches, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedBranch(null);
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setFieldErrors({});
    setSelectedBranch(branch);
    setModalOpen(true);
  };

  const handleSubmitBranch = async (payload: BranchPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedBranch?.id) {
        const updated = await updateBranch(selectedBranch.id, payload);
        setBranches((prev) =>
          prev.map((b) => (b.id === selectedBranch.id ? (updated ?? b) : b))
        );
      } else {
        const created = await createBranch(payload);
        if (created) setBranches((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedBranch(null);
      void swalSuccess('Guardado correcto', 'La sucursal se guardó correctamente.');
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al guardar', msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    const ok = await swalConfirm({
      title: 'Eliminar sucursal',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteBranch(id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      void swalSuccess('Eliminado', 'La sucursal se eliminó correctamente.');
    } catch (err) {
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al eliminar', msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <BranchFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedBranch(null);
          }
        }}
        onSubmit={handleSubmitBranch}
        initialData={selectedBranch}
        loading={modalLoading}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Sucursales"
        subtitle="Gestiona las sucursales de tu negocio para organizar mejor citas, profesionales e inventario."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base" aria-hidden>+</span>
            Nueva sucursal
          </Button>
        }
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar sucursales">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o ciudad..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {search.trim()
            ? `${filteredBranches.length} de ${branches.length} sucursales`
            : `${branches.length} sucursal${branches.length === 1 ? '' : 'es'}`}
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
            <span className="text-sm">Cargando sucursales...</span>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          icon="📍"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay sucursales'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Crea sucursales para organizar citas, profesionales e inventario.'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800" onClick={openCreateModal}>
                Crear primera sucursal
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<Branch>
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'code', header: 'Código' },
            { key: 'location', header: 'Ubicación' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredBranches}
          getItemKey={(b) => b.id}
          renderCell={(b, key) => {
            const branch = b as Branch & {
              code?: string;
              city?: string;
              country?: string;
            };
            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {branch.name}
                </span>
              );
            }
            if (key === 'code') {
              return (
                <span className="text-xs text-slate-400">
                  {(branch as any).code ?? '—'}
                </span>
              );
            }
            if (key === 'location') {
              const cityCountry =
                [branch.city, branch.country].filter(Boolean).join(', ') || '—';
              return <span className="text-xs text-slate-400">{cityCountry}</span>;
            }
            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(branch) },
                      { divider: true },
                      {
                        label: deletingId === branch.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteBranch(branch.id),
                        disabled: deletingId === branch.id,
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
    </>
  );
}

