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
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar la sucursal. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm('¿Eliminar esta sucursal? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteBranch(id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar la sucursal. Inténtalo nuevamente.'
      );
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
            <span className="mr-2 text-base" aria-hidden>
              ＋
            </span>
            Nueva sucursal
          </Button>
        }
      />

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o ciudad..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
              aria-hidden
            >
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredBranches.length} sucursal
          {filteredBranches.length === 1 ? '' : 'es'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando sucursales...
        </div>
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          icon="📍"
          title="Aún no has creado sucursales"
          description="Crea tu primera sucursal (por ejemplo: Sucursal principal, Centro, Norte) para empezar a organizar tus citas."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={openCreateModal}
            >
              Crear sucursal
            </Button>
          }
        />
      ) : (
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
      )}
    </>
  );
}

