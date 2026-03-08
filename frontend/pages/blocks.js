import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchBlocks,
  createBlock,
  deleteBlock,
} from '@/lib/api/blocks';
import { fetchProfessionals } from '@/lib/api/professionals';
import { Button, Input, Select, Modal, Textarea, Table, FloatMenu, DatePicker } from '@/components/ui';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch {
    return value;
  }
}

function BlockFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  professionals,
}) {
  const [professionalId, setProfessionalId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('block');

  useEffect(() => {
    if (open) {
      setProfessionalId('');
      setStartAt('');
      setEndAt('');
      setReason('');
      setType('block');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      professional_id: professionalId ? Number(professionalId) : null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
      reason: reason || null,
      type: type || null,
    };
    onSubmit(payload);
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
        <Select
          label="Profesional (opcional)"
          id="block-professional"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="">Bloqueo general</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <DatePicker
          label="Inicio"
          id="block-start-at"
          enableTime
          required
          value={startAt || null}
          onChange={(_, dateStr) => setStartAt(dateStr || '')}
        />

        <DatePicker
          label="Fin"
          id="block-end-at"
          enableTime
          required
          value={endAt || null}
          onChange={(_, dateStr) => setEndAt(dateStr || '')}
        />

        <Input
          label="Tipo"
          id="block-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="descanso, mantenimiento, cierre, etc."
        />

        <Textarea
          label="Motivo"
          id="block-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Detalles del motivo del bloqueo."
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear bloqueo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function BlocksPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [blocks, setBlocks] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
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
          setProfessionals(
            Array.isArray(professionalsData) ? professionalsData : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los bloqueos de tiempo.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const professionalById = useMemo(() => {
    const map = new Map();
    professionals.forEach((p) => map.set(p.id, p));
    return map;
  }, [professionals]);

  const filteredBlocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) => {
      const professionalName = String(
        b.professional?.name ??
          professionalById.get(b.professional_id)?.name ??
          ''
      ).toLowerCase();
      const reason = String(b.reason ?? '').toLowerCase();
      const type = String(b.type ?? '').toLowerCase();
      return (
        professionalName.includes(q) ||
        reason.includes(q) ||
        type.includes(q)
      );
    });
  }, [blocks, search, professionalById]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setModalOpen(true);
  };

  const handleSubmitBlock = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      const created = await createBlock(formData);
      setBlocks((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el bloqueo. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBlock = async (id) => {
    if (!window.confirm('¿Eliminar este bloqueo? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo eliminar el bloqueo. Inténtalo nuevamente.'
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
      <BlockFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
          }
        }}
        onSubmit={handleSubmitBlock}
        loading={modalLoading}
        professionals={professionals}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por profesional, motivo o tipo..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredBlocks.length} bloqueo
          {filteredBlocks.length === 1 ? '' : 's'} visibles
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
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            🚫
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no hay bloqueos de tiempo
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Crea bloqueos para que tu agenda no acepte citas en horarios no disponibles.
          </p>
        </div>
      ) : (
        <Table
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
            const professional =
              b.professional ?? professionalById.get(b.professional_id);

            if (key === 'professional') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {professional?.name ?? 'General'}
                </span>
              );
            }

            if (key === 'start') {
              return (
                <span className="text-xs text-slate-400">
                  {formatDateTime(b.start_at)}
                </span>
              );
            }

            if (key === 'end') {
              return (
                <span className="text-xs text-slate-400">
                  {formatDateTime(b.end_at)}
                </span>
              );
            }

            if (key === 'type') {
              return (
                <span className="text-xs text-slate-400">
                  {b.type || '—'}
                </span>
              );
            }

            if (key === 'reason') {
              return (
                <span className="text-xs text-slate-400">
                  {b.reason || '—'}
                </span>
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
      )}
    </DashboardLayout>
  );
}

