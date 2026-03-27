import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/layouts/AppShell';
import { createCustomerBooking, fetchCatalog, fetchCustomerMe, fetchProfessionals } from '@/lib/api/customer';
import CustomerBookingForm from '@/components/booking/CustomerBookingForm';
import type { CustomerBookingFormValues } from '@/components/booking/CustomerBookingForm';

interface Branch {
  id: number;
  name: string;
  services?: Array<{ id: number; name: string; duration_minutes?: number }>;
}

interface Professional {
  id: number;
  name: string;
  branch_id?: number;
}

export default function CustomerBooking({ slug }: { slug?: string }) {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [values, setValues] = useState<CustomerBookingFormValues>({
    branchId: '',
    serviceId: '',
    professionalId: '',
    date: '',
    time: '09:00',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchCustomerMe(slug).then((session) => {
      if (!session?.account) void router.replace(`/${slug}/login`);
    });
    fetchCatalog(slug).then((r) => setBranches((r.branches ?? []) as Branch[]));
    fetchProfessionals(slug).then((r) => setProfessionals(r as Professional[]));
  }, [slug, router]);

  const services = useMemo(() => {
    const branch = branches.find((b) => String(b.id) === values.branchId);
    return branch?.services ?? [];
  }, [branches, values.branchId]);

  if (!slug) return null;

  return (
    <AppShell slug={slug}>
      <h1 className="text-xl font-semibold text-slate-100">Agendar cita</h1>
      <CustomerBookingForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        services={services}
        professionals={professionals}
        values={values}
        message={message || undefined}
        onChange={(next) => setValues(next)}
        onSubmit={(e) => {
          e.preventDefault();
          const [h, m] = values.time.split(':').map(Number);
          const start = new Date(values.date);
          start.setHours(h, m, 0, 0);
          const duration =
            services.find((s) => String(s.id) === values.serviceId)?.duration_minutes ?? 30;
          const end = new Date(start.getTime() + duration * 60_000);
          void createCustomerBooking(slug, {
            branch_id: Number(values.branchId),
            professional_id: Number(values.professionalId),
            service_id: values.serviceId ? Number(values.serviceId) : null,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
          }).then(() => setMessage('Cita agendada correctamente.'));
        }}
      />
    </AppShell>
  );
}

