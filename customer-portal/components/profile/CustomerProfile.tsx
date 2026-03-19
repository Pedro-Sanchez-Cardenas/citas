import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/layouts/AppShell';
import { fetchCustomerMe } from '@/lib/api/customer';
import ProfileCard from '@/components/profile/ProfileCard';

export default function CustomerProfile({ slug }: { slug?: string }) {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    if (!slug) return;
    fetchCustomerMe(slug).then((session) => {
      if (!session?.account) {
        void router.replace(`/${slug}/login`);
        return;
      }
      setName(String(session.client?.name ?? ''));
      setEmail(String(session.account?.email ?? ''));
    });
  }, [slug, router]);

  if (!slug) return null;

  return (
    <AppShell slug={slug}>
      <h1 className="text-xl font-semibold text-slate-100">Mi cuenta</h1>
      <ProfileCard name={name} email={email} />
      <p className="mt-4 text-xs text-slate-500">
        Este módulo es un placeholder para que puedas agregar más funcionalidades (datos, preferencias, etc.).
      </p>
    </AppShell>
  );
}

