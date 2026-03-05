import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/api/clients';
import { Button, Input, Textarea, Select, Modal, Table } from '@/components/ui';

function ClientFormModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [birthday, setBirthday] = useState(initialData?.birthday ?? '');
  const [gender, setGender] = useState(initialData?.gender ?? '');
  const [preferredStylist, setPreferredStylist] = useState(
    initialData?.preferred_stylist ?? ''
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [allergies, setAllergies] = useState(initialData?.allergies ?? '');

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setEmail(initialData?.email ?? '');
      setPhone(initialData?.phone ?? '');
      setBirthday(initialData?.birthday ?? '');
      setGender(initialData?.gender ?? '');
      setPreferredStylist(initialData?.preferred_stylist ?? '');
      setNotes(initialData?.notes ?? '');
      setAllergies(initialData?.allergies ?? '');
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      email: email || null,
      phone: phone || null,
      birthday: birthday || null,
      gender: gender || null,
      preferred_stylist: preferredStylist || null,
      notes: notes || null,
      allergies: allergies || null,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      description="Registra los datos básicos del cliente para ofrecerle una experiencia más personalizada."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2">
          <Input
            label="Nombre completo"
            id="client-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellidos del cliente"
          />
        </div>

        <Input
          label="Correo electrónico"
          id="client-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@correo.com"
          hint="Opcional, pero útil para recordatorios y marketing."
        />

        <Input
          label="Teléfono"
          id="client-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 ..."
        />

        <Input
          label="Cumpleaños"
          id="client-birthday"
          type="date"
          value={birthday || ''}
          onChange={(e) => setBirthday(e.target.value)}
        />

        <Select
          label="Género"
          id="client-gender"
          value={gender || ''}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Sin especificar</option>
          <option value="female">Femenino</option>
          <option value="male">Masculino</option>
          <option value="non-binary">No binario</option>
          <option value="other">Otro / Prefiere no decir</option>
        </Select>

        <Input
          label="Estilista / profesional preferido"
          id="client-preferred-stylist"
          value={preferredStylist}
          onChange={(e) => setPreferredStylist(e.target.value)}
          placeholder="Nombre de la persona de confianza del cliente"
        />

        <Textarea
          label="Notas internas"
          id="client-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Preferencias, detalles importantes, historial relevante..."
        />

        <Textarea
          label="Alergias / contraindicaciones"
          id="client-allergies"
          rows={3}
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Productos, ingredientes o tratamientos a evitar."
        />

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
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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

    async function loadClients() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchClients();
        if (!cancelled) {
          setClients(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los clientes.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadClients();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const name = String(client.name ?? '').toLowerCase();
      const email = String(client.email ?? '').toLowerCase();
      const phone = String(client.phone ?? '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }, [clients, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setSelectedClient(null);
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const handleSubmitClient = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedClient?.id) {
        const updated = await updateClient(selectedClient.id, formData);
        setClients((prev) =>
          prev.map((c) => (c.id === selectedClient.id ? updated ?? c : c))
        );
      } else {
        const created = await createClient(formData);
        setClients((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedClient(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el cliente. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo eliminar el cliente. Inténtalo nuevamente.'
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
      <ClientFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedClient(null);
          }
        }}
        onSubmit={handleSubmitClient}
        initialData={selectedClient}
        loading={modalLoading}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Mantén un registro claro de tus clientes para ofrecerles un servicio memorable en cada visita.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo cliente
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
          {filteredClients.length} cliente
          {filteredClients.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando clientes...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            👤
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes clientes registrados
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Registra tus primeros clientes para comenzar a llevar historial, preferencias y comunicación personalizada.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear cliente
          </Button>
        </div>
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'contact', header: 'Contacto' },
            { key: 'birthday', header: 'Cumpleaños' },
            { key: 'preferred', header: 'Estilista preferido' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredClients}
          getItemKey={(client) => client.id}
          renderCell={(client, key) => {
            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {client.name}
                </span>
              );
            }

            if (key === 'contact') {
              return (
                <div className="space-y-0.5 text-xs text-slate-400">
                  {client.email && <div>{client.email}</div>}
                  {client.phone && (
                    <div className="text-slate-500">{client.phone}</div>
                  )}
                  {!client.email && !client.phone && '—'}
                </div>
              );
            }

            if (key === 'birthday') {
              return (
                <span className="text-xs text-slate-400">
                  {client.birthday || '—'}
                </span>
              );
            }

            if (key === 'preferred') {
              return (
                <span className="text-xs text-slate-400">
                  {client.preferred_stylist || '—'}
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
                    onClick={() => openEditModal(client)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className="text-[11px]"
                    onClick={() => handleDeleteClient(client.id)}
                    disabled={deletingId === client.id}
                  >
                    {deletingId === client.id ? 'Eliminando...' : 'Eliminar'}
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

