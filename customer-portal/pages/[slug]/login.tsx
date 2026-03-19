import { useRouter } from 'next/router';
import CustomerLogin from '@/components/auth/CustomerLogin';

export default function CustomerLoginRoute() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  return <CustomerLogin slug={slug} />;
}

