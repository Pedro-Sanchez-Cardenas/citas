import { useRouter } from 'next/router';
import CustomerRegister from '@/components/auth/CustomerRegister';

export default function CustomerRegisterRoute() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  return <CustomerRegister slug={slug} />;
}

