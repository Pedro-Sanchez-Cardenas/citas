import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBlocks,
  createBlock,
  deleteBlock,
  type Block,
  type CreateBlockPayload,
} from '@/lib/api/blocks';
import { fetchProfessionals } from '@/lib/api/professionals';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDateTime } from '@/lib/format';
import { Button, Input, Table, FloatMenu, EmptyState } from '@/components/ui';
import { BlockFormModal } from '@/components/blocks';
import type { Professional } from '@/types';
import type { AxiosError } from 'axios';

export default function BlocksPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
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

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [blocksData, professionalsData] = await Promise.all([
          fetchBlocks(),
          fetchProfessionals(),
        ]);
        if (!cancelled) {
          setBlocks(Array.isArray(blocksData) ? blocksData : []);
          setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los bloqueos de tiempo.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [user, logout]);

  const professionalById = useMemo(() => {
    const map = new Map<number, Professional>();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const filteredBlocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) => {
      const blockWithProfessional = b as Block & { professional?: { name: string } };
      const professionalName = String(
        blockWithProfessional.professional?.name ??
          professionalById.get(b.professional_id ?? 0)?.name ??
          ''
      ).toLowerCase();
      const reason = String(b.reason ?? '').toLowerCase();
      const type = String(b.type ?? '').toLowerCase();
      return (
        professionalName.includes(q) || reason.includes(q) || type.includes(q)
      );
    });
  }, [blocks, search, professionalById]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setModalOpen(true);
  };

  const handleSubmitBlock = async (formData: CreateBlockPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const created = await createBlock(formData);
      if (created) setBlocks((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el bloqueo. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!window.confirm('¿Eliminar este bloqueo? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar el bloqueo. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <BlockFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
          }
        }}
        onSubmit={handleSubmitBlock}
        loading={modalLoading}
        professionals={professionals}
        fieldErrors={fieldErrors}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Bloqueos de tiempo
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona los periodos bloqueados en la agenda (descansos, cierres, eventos internos).
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo bloqueo
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por profesional, motivo o tipo..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredBlocks.length} bloqueo{filteredBlocks.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando bloqueos...
        </div>
      ) : filteredBlocks.length === 0 ? (
        <EmptyState
          icon="🚫"
          title="Aún no hay bloqueos de tiempo"
          description="Crea bloqueos para que tu agenda no acepte citas en horarios no disponibles (vacaciones, descansos, etc.)."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={openCreateModal}
            >
              Crear bloqueo
            </Button>
          }
        />
      ) : (
        <Table<Block>
          columns={[
            { key: 'professional', header: 'Profesional' },
            { key: 'start', header: 'Inicio' },
            { key: 'end', header: 'Fin' },
            { key: 'type', header: 'Tipo' },
            { key: 'reason', header: 'Motivo' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredBlocks}
          getItemKey={(b) => b.id}
          renderCell={(b, key) => {
            const blockWithProfessional = b as Block & { professional?: { name: string } };
            const professional =
              blockWithProfessional.professional ?? professionalById.get(b.professional_id ?? 0);

            if (key === 'professional') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {professional?.name ?? 'General'}
                </span>
              );
            }
            if (key === 'start') {
              return (
                <span className="text-xs text-slate-400">{formatDateTime(b.start_at)}</span>
              );
            }
            if (key === 'end') {
              return (
                <span className="text-xs text-slate-400">{formatDateTime(b.end_at)}</span>
              );
            }
            if (key === 'type') {
              return (
                <span className="text-xs text-slate-400">{b.type || '—'}</span>
              );
            }
            if (key === 'reason') {
              return (
                <span className="text-xs text-slate-400">{b.reason || '—'}</span>
              );
            }
            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      {
                        label: deletingId === b.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteBlock(b.id),
                        disabled: deletingId === b.id,
                      },
                    ]}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
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
