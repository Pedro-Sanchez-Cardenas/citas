import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchCatalog, fetchCustomerMe, registerCustomer } from '@/lib/api/customer';
import RegisterForm from '@/components/auth/RegisterForm';
import type { RegisterFormValues } from '@/components/auth/RegisterForm';

export default function CustomerRegister({ slug }: { slug?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
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
    <RegisterForm
      brandName={brandName}
      error={error}
      values={values}
      onChange={(next) => setValues(next)}
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        void registerCustomer(slug, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
        })
          .then(() => router.push(`/${slug}/book`))
          .catch(() => setError('No se pudo crear tu cuenta'));
      }}
      onGoLogin={() => router.push(`/${slug}/login`)}
    />
  );
}

