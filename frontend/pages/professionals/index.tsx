import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  type CreateProfessionalPayload,
} from '@/lib/api/professionals';
import { fetchBranches } from '@/lib/api/branches';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState } from '@/components/ui';
import { clientPhotoUrl } from '@/lib/api';
import {
  ProfessionalFormModal,
  formatMoneyFromCents,
  type ProfessionalFormPayload,
} from '@/components/professionals';
import type { Professional, Branch } from '@/types';
import type { AxiosError } from 'axios';

type ProfessionalRow = Professional & {
  email?: string;
  phone?: string;
  color?: string;
  commission_rate?: number;
  base_salary_cents?: number;
  is_active?: boolean;
  photo_url?: string | null;
};

export default function ProfessionalsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
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

    async function loadProfessionals() {
      setLoading(true);
      setError('');
      try {
        const [prosData, branchesData] = await Promise.all([
          fetchProfessionals(),
          fetchBranches(),
        ]);
        if (!cancelled) {
          setProfessionals(Array.isArray(prosData) ? prosData : []);
          setBranches(Array.isArray(branchesData) ? branchesData : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los profesionales.'
          );
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfessionals();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredProfessionals = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return professionals;
    return professionals.filter((prof) => {
      const row = prof as ProfessionalRow;
      const name = String(prof.name ?? '').toLowerCase();
      const email = String(row.email ?? '').toLowerCase();
      const phone = String(row.phone ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [professionals, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedProfessional(null);
    setModalOpen(true);
  };

  const openEditModal = (prof: Professional) => {
    setFieldErrors({});
    setSelectedProfessional(prof);
    setModalOpen(true);
  };

  const handleSubmitProfessional = async (
    formData: ProfessionalFormPayload,
    photo?: File | null
  ) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedProfessional?.id) {
        const updated = await updateProfessional(
          selectedProfessional.id,
          formData as Partial<CreateProfessionalPayload>,
          photo
        );
        setProfessionals((prev) =>
          prev.map((p) => (p.id === selectedProfessional.id ? updated ?? p : p))
        );
      } else {
        const created = await createProfessional(
          formData as CreateProfessionalPayload,
          photo
        );
        if (created) setProfessionals((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedProfessional(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el profesional. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProfessional = async (id: number) => {
    if (!window.confirm('¿Eliminar este profesional? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteProfessional(id);
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo eliminar el profesional. Inténtalo nuevamente.'
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
      <ProfessionalFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedProfessional(null);
          }
        }}
        onSubmit={handleSubmitProfessional}
        initialData={selectedProfessional}
        loading={modalLoading}
        fieldErrors={fieldErrors}
        branches={branches}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Profesionales
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona a las personas de tu equipo y su información clave para la agenda.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo profesional
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o teléfono..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredProfessionals.length} profesional
          {filteredProfessionals.length === 1 ? '' : 'es'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando profesionales...
        </div>
      ) : filteredProfessionals.length === 0 ? (
        <EmptyState
          icon="💇"
          title="Aún no has registrado a tu equipo"
          description="Agrega a los profesionales para poder asignarles citas, ver su carga de trabajo y analizar reportes."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={openCreateModal}
            >
              Crear profesional
            </Button>
          }
        />
      ) : (
        <Table<Professional>
          columns={[
            { key: 'professional', header: 'Profesional' },
            { key: 'contact', header: 'Contacto' },
            { key: 'commission', header: 'Comisión' },
            { key: 'salary', header: 'Salario base' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredProfessionals}
          getItemKey={(prof) => prof.id}
          renderCell={(prof, key) => {
            const row = prof as ProfessionalRow;
            if (key === 'professional') {
              return (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-700/80 bg-slate-800">
                    {row.photo_url ? (
                      <img
                        src={clientPhotoUrl(row.photo_url) ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center rounded-full border border-slate-700/80"
                        style={{ backgroundColor: row.color || '#0f172a' }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-50">{prof.name}</span>
                </div>
              );
            }

            if (key === 'contact') {
              return (
                <div className="space-y-0.5 text-xs text-slate-400">
                  {row.email && <div>{row.email}</div>}
                  {row.phone && <div className="text-slate-500">{row.phone}</div>}
                  {!row.email && !row.phone && '—'}
                </div>
              );
            }

            if (key === 'commission') {
              return (
                <span className="text-xs text-slate-400">
                  {row.commission_rate != null ? `${row.commission_rate}%` : '—'}
                </span>
              );
            }

            if (key === 'salary') {
              return (
                <span className="text-xs text-slate-400">
                  {formatMoneyFromCents(row.base_salary_cents)}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    row.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
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
                      { label: 'Editar', onClick: () => openEditModal(prof) },
                      { divider: true },
                      {
                        label: deletingId === prof.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteProfessional(prof.id),
                        disabled: deletingId === prof.id,
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
    </>
  );
}
