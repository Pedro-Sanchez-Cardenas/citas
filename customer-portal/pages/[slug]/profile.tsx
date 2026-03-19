import { useRouter } from 'next/router';
import CustomerProfile from '@/components/profile/CustomerProfile';

export default function CustomerProfileRoute() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  return <CustomerProfile slug={slug} />;
}

