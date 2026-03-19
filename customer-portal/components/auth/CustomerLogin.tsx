import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCatalog, fetchCustomerMe, loginCustomer } from '@/lib/api/customer';
import LoginForm from '@/components/auth/LoginForm';
import type { LoginFormValues } from '@/components/auth/LoginForm';

export default function CustomerLogin({ slug }: { slug?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [brandName, setBrandName] = useState('Tu salón');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetchCatalog(slug).then((r) => setBrandName(String(r.business?.name ?? slug)));
    fetchCustomerMe(slug).then((session) => {
      if (session?.account) void router.replace(`/${slug}/book`);
    });
  }, [slug, router]);

  if (!slug) return null;

  return (
    <LoginForm
      brandName={brandName}
      error={error}
      values={values}
      onChange={(next) => setValues(next)}
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        void loginCustomer(slug, values)
          .then(() => router.push(`/${slug}/book`))
          .catch(() => setError('Credenciales inválidas'));
      }}
      onGoRegister={() => router.push(`/${slug}/register`)}
    />
  );
}

