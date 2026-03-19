import { useRouter } from 'next/router';
import CustomerAppointments from '@/components/appointments/CustomerAppointments';

export default function CustomerAppointmentsRoute() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  return <CustomerAppointments slug={slug} />;
}

