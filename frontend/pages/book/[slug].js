import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchPublicServices,
  fetchPublicProfessionals,
  createPublicBooking,
} from '@/lib/api/publicBooking';
import { Button, Input, Select } from '@/components/ui';

export default function PublicBookPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [branchesWithServices, setBranchesWithServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [branchId, setBranchId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const branches = useMemo(
    () => (Array.isArray(branchesWithServices) ? branchesWithServices : []),
    [branchesWithServices]
  );

  const services = useMemo(() => {
    const branch = branches.find((b) => String(b.id) === String(branchId));
    const list = branch?.services ?? [];
    return Array.isArray(list) ? list : [];
  }, [branches, branchId]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(serviceId)),
    [services, serviceId]
  );

  const durationMinutes = selectedService?.duration_minutes ?? 30;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetchPublicServices(slug),
      fetchPublicProfessionals(slug),
    ])
      .then(([branchesData, prosData]) => {
        if (cancelled) return;
        setBranchesWithServices(Array.isArray(branchesData) ? branchesData : []);
        setProfessionals(Array.isArray(prosData) ? prosData : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.response?.status === 404
              ? 'Negocio no encontrado'
              : 'No se pudo cargar la información.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const professionalsForBranch = useMemo(() => {
    if (!branchId) return professionals;
    return professionals.filter((p) => String(p.branch_id) === String(branchId));
  }, [professionals, branchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slug || !branchId || !professionalId || !date || !time || !clientName.trim()) {
      setError('Completa sucursal, profesional, fecha, hora y nombre.');
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const startAt = new Date(date);
    startAt.setHours(hours, minutes, 0, 0);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

    setSubmitting(true);
    setError('');
    try {
      await createPublicBooking(slug, {
        branch_id: Number(branchId),
        professional_id: Number(professionalId),
        service_id: serviceId ? Number(serviceId) : null,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        client_email: clientEmail.trim() || null,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: 'scheduled',
        source: 'online',
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo registrar la cita. Intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!slug) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Reservar cita
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Completa el formulario para agendar tu cita.
        </p>

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Cita registrada correctamente. Te contactaremos si es necesario.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-center text-sm text-slate-400">
            Cargando...
          </div>
        ) : !success ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Select
              label="Sucursal"
              id="branch"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setServiceId('');
              }}
              required
            >
              <option value="">Selecciona sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>

            <Select
              label="Servicio"
              id="service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Selecciona servicio (opcional)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.duration_minutes ? `(${s.duration_minutes} min)` : ''}
                </option>
              ))}
            </Select>

            <Select
              label="Profesional"
              id="professional"
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              required
            >
              <option value="">Selecciona profesional</option>
              {professionalsForBranch.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Fecha"
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <Input
                label="Hora"
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <Input
              label="Nombre completo"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
            <Input
              label="Teléfono"
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+52 ..."
            />
            <Input
              label="Correo"
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />

            <div className="pt-2">
              <Button type="submit" size="md" disabled={submitting} className="w-full">
                {submitting ? 'Enviando...' : 'Reservar cita'}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="subtle"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSuccess(false);
              setClientName('');
              setClientPhone('');
              setClientEmail('');
              setDate('');
              setTime('09:00');
            }}
          >
            Hacer otra reserva
          </Button>
        )}
      </div>
    </div>
  );
}
