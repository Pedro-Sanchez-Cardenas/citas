import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
} from '@/lib/api/professionals';
import { Button, Input, Select, Checkbox, Modal, Table } from '@/components/ui';

function formatMoneyFromCents(amountCents, currency = 'USD') {
  if (amountCents == null) return '—';
  const amount = (amountCents / 100).toFixed(2);
  const symbol = currency === 'USD' ? '$' : '$';
  return `${symbol}${amount}`;
}

function ProfessionalFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [color, setColor] = useState(initialData?.color ?? '#22c55e');
  const [commissionRate, setCommissionRate] = useState(
    initialData?.commission_rate != null
      ? initialData.commission_rate.toString()
      : ''
  );
  const [baseSalary, setBaseSalary] = useState(
    initialData?.base_salary_cents != null
      ? (initialData.base_salary_cents / 100).toString()
      : ''
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setEmail(initialData?.email ?? '');
      setPhone(initialData?.phone ?? '');
      setColor(initialData?.color ?? '#22c55e');
      setCommissionRate(
        initialData?.commission_rate != null
          ? initialData.commission_rate.toString()
          : ''
      );
      setBaseSalary(
        initialData?.base_salary_cents != null
          ? (initialData.base_salary_cents / 100).toString()
          : ''
      );
      setIsActive(initialData?.is_active ?? true);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      email: email || null,
      phone: phone || null,
      color: color || null,
      commission_rate:
        commissionRate && !Number.isNaN(Number(commissionRate))
          ? Number(commissionRate)
          : null,
      base_salary_cents:
        baseSalary && !Number.isNaN(Number(baseSalary))
          ? Math.round(Number(baseSalary) * 100)
          : null,
      is_active: !!isActive,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar profesional' : 'Nuevo profesional'}
      description="Administra a las personas de tu equipo: datos de contacto, color en la agenda y condiciones económicas."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2">
          <Input
            label="Nombre del profesional"
            id="professional-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellidos"
          />
        </div>

        <Input
          label="Correo electrónico"
          id="professional-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="equipo@salon.com"
        />

        <Input
          label="Teléfono"
          id="professional-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 ..."
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
            Color en agenda
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color || '#22c55e'}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-slate-900"
            />
            <span className="text-xs text-slate-400">
              Usa un color distintivo para identificar rápidamente a la persona en la agenda.
            </span>
          </div>
        </div>

        <Input
          label="Comisión (%)"
          id="professional-commission"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value)}
          placeholder="Ej. 40"
          hint="Porcentaje de comisión sobre los servicios realizados."
        />

        <Input
          label="Salario base (mensual)"
          id="professional-base-salary"
          type="number"
          min={0}
          step="0.01"
          value={baseSalary}
          onChange={(e) => setBaseSalary(e.target.value)}
          placeholder="Ej. 8000.00"
          hint="Opcional. Se guarda en la base de datos en centavos."
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            label="Profesional activo (aparece para agendar citas)"
          />
        </div>

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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear profesional'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProfessionalsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
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

    async function loadProfessionals() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProfessionals();
        if (!cancelled) {
          setProfessionals(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los profesionales.'
          );
          if (err?.response?.status === 401) {
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
      const name = String(prof.name ?? '').toLowerCase();
      const email = String(prof.email ?? '').toLowerCase();
      const phone = String(prof.phone ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [professionals, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setSelectedProfessional(null);
    setModalOpen(true);
  };

  const openEditModal = (prof) => {
    setSelectedProfessional(prof);
    setModalOpen(true);
  };

  const handleSubmitProfessional = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedProfessional?.id) {
        const updated = await updateProfessional(selectedProfessional.id, formData);
        setProfessionals((prev) =>
          prev.map((p) => (p.id === selectedProfessional.id ? updated ?? p : p))
        );
      } else {
        const created = await createProfessional(formData);
        setProfessionals((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedProfessional(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el profesional. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProfessional = async (id) => {
    if (!window.confirm('¿Eliminar este profesional? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteProfessional(id);
      setProfessionals((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
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
    <DashboardLayout user={user} onLogout={logout}>
      <ProfessionalFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedProfessional(null);
          }
        }}
        onSubmit={handleSubmitProfessional}
        initialData={selectedProfessional}
        loading={modalLoading}
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
              onChange={(e) => setSearch(e.target.value)}
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
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            💇
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no has registrado a tu equipo
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Agrega a los profesionales para poder asignarles citas, ver su carga de trabajo y analizar reportes.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear profesional
          </Button>
        </div>
      ) : (
        <Table
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
            if (key === 'professional') {
              return (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-50">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/80"
                    style={{ backgroundColor: prof.color || '#0f172a' }}
                  />
                  <span>{prof.name}</span>
                </div>
              );
            }

            if (key === 'contact') {
              return (
                <div className="space-y-0.5 text-xs text-slate-400">
                  {prof.email && <div>{prof.email}</div>}
                  {prof.phone && (
                    <div className="text-slate-500">{prof.phone}</div>
                  )}
                  {!prof.email && !prof.phone && '—'}
                </div>
              );
            }

            if (key === 'commission') {
              return (
                <span className="text-xs text-slate-400">
                  {prof.commission_rate != null ? `${prof.commission_rate}%` : '—'}
                </span>
              );
            }

            if (key === 'salary') {
              return (
                <span className="text-xs text-slate-400">
                  {formatMoneyFromCents(prof.base_salary_cents)}
                </span>
              );
            }

            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    prof.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`mr-1 h-1.5 w-1.5 rounded-full ${
                      prof.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {prof.is_active ? 'Activo' : 'Inactivo'}
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
                    onClick={() => openEditModal(prof)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => handleDeleteProfessional(prof.id)}
                    disabled={deletingId === prof.id}
                  >
                    {deletingId === prof.id ? 'Eliminando...' : 'Eliminar'}
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

