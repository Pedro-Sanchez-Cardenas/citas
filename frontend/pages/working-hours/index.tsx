import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchWorkingHours,
  createWorkingHour,
  updateWorkingHour,
  deleteWorkingHour,
  type WorkingHour,
  type CreateWorkingHourPayload,
} from '@/lib/api/workingHours';
import {
  fetchBlocks,
  createBlock,
  deleteBlock,
  type Block,
  type CreateBlockPayload,
} from '@/lib/api/blocks';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchBranches } from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  Button,
  Input,
  Table,
  FloatMenu,
  EmptyState,
  Alert,
  PageHeader,
} from '@/components/ui';
import { WorkingHourFormModal, WEEKDAYS } from '@/components/working-hours';
import { BlockFormModal } from '@/components/blocks';
import type { Branch, Professional } from '@/types';
import type { AxiosError } from 'axios';

type TabId = 'availability' | 'blocks';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'availability', label: 'Disponibilidad', icon: '⏰' },
  { id: 'blocks', label: 'Bloqueos', icon: '🚫' },
];

export default function WorkingHoursPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('availability');
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [hourModalOpen, setHourModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [hourModalLoading, setHourModalLoading] = useState(false);
  const [blockModalLoading, setBlockModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedHour, setSelectedHour] = useState<WorkingHour | null>(null);
  const [deletingHourId, setDeletingHourId] = useState<number | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);

  const tabFromQuery = (router.query.tab as string) === 'blocks' ? 'blocks' : 'availability';
  useEffect(() => {
    setActiveTab(tabFromQuery);
  }, [tabFromQuery]);

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
        const [hoursData, blocksData, professionalsData, branchesData] = await Promise.all([
          fetchWorkingHours(),
          fetchBlocks(),
          fetchProfessionals(),
          fetchBranches(),
        ]);
        if (!cancelled) {
          setHours(Array.isArray(hoursData) ? hoursData : []);
          setBlocks(Array.isArray(blocksData) ? blocksData : []);
          setProfessionals(Array.isArray(professionalsData) ? professionalsData : []);
          setBranches(Array.isArray(branchesData) ? branchesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudieron cargar los datos.'
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

  const filteredHours = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hours;
    return hours.filter((row) => {
      const rowWithProf = row as WorkingHour & { professional?: { name: string } };
      const professionalName = String(
        rowWithProf.professional?.name ??
          professionalById.get(row.professional_id ?? 0)?.name ??
          ''
      ).toLowerCase();
      const weekdayLabel = WEEKDAYS[row.weekday ?? 0].toLowerCase();
      return professionalName.includes(q) || weekdayLabel.includes(q);
    });
  }, [hours, search, professionalById]);

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
      return professionalName.includes(q) || reason.includes(q) || type.includes(q);
    });
  }, [blocks, search, professionalById]);

  const isLoading = authLoading || loading;

  const openCreateHourModal = () => {
    setFieldErrors({});
    setSelectedHour(null);
    setHourModalOpen(true);
  };

  const openEditHourModal = (hour: WorkingHour) => {
    setFieldErrors({});
    setSelectedHour(hour);
    setHourModalOpen(true);
  };

  const openCreateBlockModal = () => {
    setFieldErrors({});
    setBlockModalOpen(true);
  };

  const handleSubmitHour = async (formData: CreateWorkingHourPayload) => {
    setHourModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedHour?.id) {
        const updated = await updateWorkingHour(selectedHour.id, formData);
        setHours((prev) =>
          prev.map((h) => (h.id === selectedHour.id ? updated ?? h : h))
        );
      } else {
        const created = await createWorkingHour(formData);
        if (created) setHours((prev) => [created, ...prev]);
      }
      setHourModalOpen(false);
      setSelectedHour(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el horario. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setHourModalLoading(false);
    }
  };

  const handleDeleteHour = async (id: number) => {
    if (!window.confirm('¿Eliminar este horario? Esta acción no se puede deshacer.')) return;
    setDeletingHourId(id);
    setError('');
    try {
      await deleteWorkingHour(id);
      setHours((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message || 'No se pudo eliminar el horario. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingHourId(null);
    }
  };

  const handleSubmitBlock = async (formData: CreateBlockPayload) => {
    setBlockModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const created = await createBlock(formData);
      if (created) setBlocks((prev) => [created, ...prev]);
      setBlockModalOpen(false);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el bloqueo. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setBlockModalLoading(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!window.confirm('¿Eliminar este bloqueo? Esta acción no se puede deshacer.')) return;
    setDeletingBlockId(id);
    setError('');
    try {
      await deleteBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message || 'No se pudo eliminar el bloqueo. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingBlockId(null);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <WorkingHourFormModal
        open={hourModalOpen}
        onClose={() => {
          if (!hourModalLoading) {
            setFieldErrors({});
            setHourModalOpen(false);
            setSelectedHour(null);
          }
        }}
        onSubmit={handleSubmitHour}
        initialData={selectedHour}
        loading={hourModalLoading}
        branches={branches}
        professionals={professionals}
        fieldErrors={fieldErrors}
      />
      <BlockFormModal
        open={blockModalOpen}
        onClose={() => {
          if (!blockModalLoading) {
            setFieldErrors({});
            setBlockModalOpen(false);
          }
        }}
        onSubmit={handleSubmitBlock}
        loading={blockModalLoading}
        professionals={professionals}
        fieldErrors={fieldErrors}
      />

      <>
        <PageHeader
          title="Horarios y disponibilidad"
          subtitle="Configura los horarios en los que tu equipo puede recibir citas y los bloqueos de tiempo (descansos, vacaciones, cierres). Todo en un solo lugar."
          action={
            activeTab === 'availability' ? (
              <Button type="button" onClick={openCreateHourModal} size="md">
                <span className="mr-2 text-base" aria-hidden>＋</span>
                Nuevo horario
              </Button>
            ) : (
              <Button type="button" onClick={openCreateBlockModal} size="md">
                <span className="mr-2 text-base" aria-hidden>＋</span>
                Nuevo bloqueo
              </Button>
            )
          }
        />

        <div
          role="tablist"
          aria-label="Secciones de horarios"
          className="mb-6 flex gap-1 rounded-xl bg-slate-900/50 p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch('');
                router.replace(
                  { pathname: '/working-hours', query: tab.id === 'blocks' ? { tab: 'blocks' } : {} },
                  undefined,
                  { shallow: true }
                );
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700/80 text-slate-50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <section
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label={activeTab === 'availability' ? 'Buscar horarios' : 'Buscar bloqueos'}
        >
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'availability'
                    ? 'Buscar por profesional o día...'
                    : 'Buscar por profesional, motivo o tipo...'
                }
                inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
              />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>
                🔍
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {activeTab === 'availability' &&
              `${filteredHours.length} horario${filteredHours.length === 1 ? '' : 's'} visibles`}
            {activeTab === 'blocks' &&
              `${filteredBlocks.length} bloqueo${filteredBlocks.length === 1 ? '' : 's'} visibles`}
          </div>
        </section>

        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-400">
            Cargando...
          </div>
        ) : activeTab === 'availability' ? (
          <div
            id="panel-availability"
            role="tabpanel"
            aria-labelledby="tab-availability"
            className="min-w-0"
          >
            {filteredHours.length === 0 ? (
              <EmptyState
                icon="⏰"
                title="Aún no has configurado horarios"
                description="Define los horarios por día y profesional en los que tu equipo puede recibir citas. La agenda usará esta información para validar la disponibilidad."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    onClick={openCreateHourModal}
                  >
                    Crear horario
                  </Button>
                }
              />
            ) : (
              <Table<WorkingHour>
                columns={[
                  { key: 'weekday', header: 'Día' },
                  { key: 'professional', header: 'Profesional' },
                  { key: 'time', header: 'Horario' },
                  { key: 'range', header: 'Vigencia' },
                  { key: 'status', header: 'Estado' },
                  { key: 'actions', header: 'Acciones', align: 'right' },
                ]}
                items={filteredHours}
                getItemKey={(row) => row.id}
                renderCell={(row, key) => {
                  const rowWithProf = row as WorkingHour & { professional?: { name: string } };
                  const professional =
                    rowWithProf.professional ?? professionalById.get(row.professional_id ?? 0);
                  if (key === 'weekday') {
                    return (
                      <span className="text-sm font-medium text-slate-50">
                        {WEEKDAYS[row.weekday ?? 0]}
                      </span>
                    );
                  }
                  if (key === 'professional') {
                    return (
                      <span className="text-xs text-slate-400">
                        {professional?.name ?? 'Horario general'}
                      </span>
                    );
                  }
                  if (key === 'time') {
                    return (
                      <span className="text-xs text-slate-400">
                        {row.start_time} – {row.end_time}
                      </span>
                    );
                  }
                  if (key === 'range') {
                    return (
                      <span className="text-xs text-slate-400">
                        {row.effective_from ? formatDate(row.effective_from) : 'Desde siempre'}{' '}
                        {row.effective_until ? `→ ${formatDate(row.effective_until)}` : ''}
                      </span>
                    );
                  }
                  if (key === 'status') {
                    return (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          row.is_active
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-slate-700/80 bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span
                          className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            row.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {row.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    );
                  }
                  if (key === 'actions') {
                    return (
                      <div className="flex justify-end">
                        <FloatMenu
                          placement="bottom-end"
                          options={[
                            { label: 'Editar', onClick: () => openEditHourModal(row) },
                            { divider: true },
                            {
                              label: deletingHourId === row.id ? 'Eliminando...' : 'Eliminar',
                              onClick: () => handleDeleteHour(row.id),
                              disabled: deletingHourId === row.id,
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
          </div>
        ) : (
          <div
            id="panel-blocks"
            role="tabpanel"
            aria-labelledby="tab-blocks"
            className="min-w-0"
          >
            {filteredBlocks.length === 0 ? (
              <EmptyState
                icon="🚫"
                title="Aún no hay bloqueos de tiempo"
                description="Crea bloqueos para que la agenda no acepte citas en horarios no disponibles: vacaciones, descansos, mantenimiento o eventos internos."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    onClick={openCreateBlockModal}
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
                    blockWithProfessional.professional ??
                    professionalById.get(b.professional_id ?? 0);
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
                    return <span className="text-xs text-slate-400">{b.type || '—'}</span>;
                  }
                  if (key === 'reason') {
                    return <span className="text-xs text-slate-400">{b.reason || '—'}</span>;
                  }
                  if (key === 'actions') {
                    return (
                      <div className="flex justify-end">
                        <FloatMenu
                          placement="bottom-end"
                          options={[
                            {
                              label: deletingBlockId === b.id ? 'Eliminando...' : 'Eliminar',
                              onClick: () => handleDeleteBlock(b.id),
                              disabled: deletingBlockId === b.id,
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
          </div>
        )}
      </>
    </>
  );
}
