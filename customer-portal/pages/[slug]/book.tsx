import { useRouter } from 'next/router';
import CustomerBooking from '@/components/booking/CustomerBooking';

export default function CustomerBookRoute() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  return <CustomerBooking slug={slug} />;
}

