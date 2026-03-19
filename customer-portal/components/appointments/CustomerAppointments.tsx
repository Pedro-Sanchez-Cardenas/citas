import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/layouts/AppShell';
import { fetchCustomerAppointments, fetchCustomerMe } from '@/lib/api/customer';
import AppointmentsList from '@/components/appointments/AppointmentsList';
import type { AppointmentRow } from '@/components/appointments/AppointmentsList';

export default function CustomerAppointments({ slug }: { slug?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<AppointmentRow[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetchCustomerMe(slug).then((session) => {
      if (!session?.account) void router.replace(`/${slug}/login`);
    });
    fetchCustomerAppointments(slug).then((rows) =>
      setItems((rows as AppointmentRow[]) ?? [])
    );
  }, [slug, router]);

  if (!slug) return null;

  return (
    <AppShell slug={slug}>
      <h1 className="text-xl font-semibold text-slate-100">Mis citas</h1>
      <AppointmentsList items={items} />
    </AppShell>
  );
}

