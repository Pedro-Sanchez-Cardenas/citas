import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  fetchClientHistory,
  type CreateClientPayload,
} from '@/lib/api/clients';
import { clientPhotoUrl } from '@/lib/api';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button, Input, Textarea, Select, Modal, Table, FloatMenu, DatePicker } from '@/components/ui';
import type { Client } from '@/types';
import type { AxiosError } from 'axios';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload, photo?: File | null) => Promise<void>;
  initialData: Client | null;
  loading: boolean;
  fieldErrors: FormFieldErrors;
}

function ClientFormModal({ open, onClose, onSubmit, initialData, loading, fieldErrors }: ClientFormModalProps) {
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;
  const photoDisplay = photoPreview || clientPhotoUrl(initialData?.photo_url) || null;

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CreateClientPayload = {
      name,
      email: email || null,
      phone: phone || null,
      birthday: birthday || null,
      gender: gender || null,
      preferred_stylist: preferredStylist || null,
      notes: notes || null,
      allergies: allergies || null,
    };
    void onSubmit(payload, photoFile);
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
        <div className="md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0">
            <Input
              label="Nombre completo"
              id="client-name"
              required
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Nombre y apellidos del cliente"
              error={fieldErrors.name}
            />
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Foto del cliente
            </span>
            <div className="flex items-center gap-3">
              <label
                htmlFor="client-photo"
                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-600 bg-slate-800/60 transition hover:border-slate-500 hover:bg-slate-800/80"
              >
                {photoDisplay ? (
                  <img
                    src={photoDisplay}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-slate-500">👤</span>
                )}
              </label>
              <input
                id="client-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="client-photo"
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 cursor-pointer"
                >
                  {photoDisplay ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <p className="text-[11px] text-slate-500">JPG, PNG o WebP. Máx. 5 MB</p>
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Correo electrónico"
          id="client-email"
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="cliente@correo.com"
          hint="Opcional, pero útil para recordatorios y marketing."
          error={fieldErrors.email}
        />

        <Input
          label="Teléfono"
          id="client-phone"
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          placeholder="+52 ..."
          error={fieldErrors.phone}
        />

        <DatePicker
          label="Cumpleaños"
          id="client-birthday"
          value={birthday || null}
          onChange={(_, dateStr) => setBirthday(dateStr || '')}
          error={fieldErrors.birthday}
        />

        <Select
          label="Género"
          id="client-gender"
          value={gender || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
          error={fieldErrors.gender}
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPreferredStylist(e.target.value)}
          placeholder="Nombre de la persona de confianza del cliente"
          error={fieldErrors.preferred_stylist}
        />

        <Textarea
          label="Notas internas"
          id="client-notes"
          rows={3}
          value={notes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder="Preferencias, detalles importantes, historial relevante..."
          error={fieldErrors.notes}
        />

        <Textarea
          label="Alergias / contraindicaciones"
          id="client-allergies"
          rows={3}
          value={allergies}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAllergies(e.target.value)}
          placeholder="Productos, ingredientes o tratamientos a evitar."
          error={fieldErrors.allergies}
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

interface ClientHistoryAppointment {
  id: number;
  start_at?: string;
  service?: { name: string };
  combined_service?: { name: string };
  professional?: { name: string };
  status?: string;
}

interface ClientMediaItem {
  id: number;
  url: string;
  type: string;
}

interface ClientDetailData {
  client?: Client;
  appointments?: ClientHistoryAppointment[];
  media?: ClientMediaItem[];
}

interface ClientDetailModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

function ClientDetailModal({ open, onClose, client }: ClientDetailModalProps) {
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !client?.id) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    fetchClientHistory(client.id)
      .then((res) => {
        if (!cancelled) setData((res as ClientDetailData) ?? { client, appointments: [], media: [] });
      })
      .catch(() => {
        if (!cancelled) setData({ client, appointments: [], media: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, client?.id, client]);

  const clientData = data?.client ?? client;
  const appointments = data?.appointments ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Detalle del cliente" description="" size="lg">
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Cargando...</div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-700/80 bg-slate-800">
              {clientData?.photo_url ? (
                <img
                  src={clientPhotoUrl(clientData.photo_url) ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-medium text-slate-400">
                  {clientData?.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-50">{clientData?.name}</p>
              {(clientData?.email || clientData?.phone) && (
                <p className="mt-1 text-xs text-slate-400">
                  {[clientData?.email, clientData?.phone].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            <p className="mb-2 text-xs font-medium text-slate-400">Historial de citas</p>
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500">Sin citas registradas.</p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-slate-200">{formatDateTime(a.start_at)}</span>
                  <span className="text-slate-400">{a.service?.name ?? a.combined_service?.name ?? '—'}</span>
                  <span className="text-slate-400">{a.professional?.name ?? '—'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${a.status === 'attended' ? 'bg-emerald-500/20 text-emerald-300' : a.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'}`}>
                    {a.status ?? '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);

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
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los clientes.'
          );
          if (ax?.response?.status === 401) {
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
    setFieldErrors({});
    setSelectedClient(null);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setFieldErrors({});
    setSelectedClient(client);
    setModalOpen(true);
  };

  const handleSubmitClient = async (formData: CreateClientPayload, photo?: File | null) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedClient?.id) {
        const updated = await updateClient(selectedClient.id, formData, photo);
        setClients((prev) =>
          prev.map((c) => (c.id === selectedClient.id ? updated ?? c : c))
        );
      } else {
        const created = await createClient(formData, photo);
        if (created) setClients((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedClient(null);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo guardar el cliente. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
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
    <>
      <ClientDetailModal
        open={!!detailClient}
        onClose={() => setDetailClient(null)}
        client={detailClient}
      />
      <ClientFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedClient(null);
          }
        }}
        onSubmit={handleSubmitClient}
        initialData={selectedClient}
        loading={modalLoading}
        fieldErrors={fieldErrors}
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
        <Table<Client>
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
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-700/80 bg-slate-800">
                    {client.photo_url ? (
                      <img
                        src={clientPhotoUrl(client.photo_url) ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                        {client.name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-50">{client.name}</span>
                </div>
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
                <span className="text-xs text-slate-200">
                  {formatDate(client.birthday)}
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
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Ver detalle', onClick: () => setDetailClient(client) },
                      { label: 'Editar', onClick: () => openEditModal(client) },
                      { divider: true },
                      {
                        label: deletingId === client.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteClient(client.id),
                        disabled: deletingId === client.id,
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
