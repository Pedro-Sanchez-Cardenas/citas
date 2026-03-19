import { useState } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold text-slate-50">Portal de clientes</h1>
      <p className="mt-2 text-sm text-slate-400">Ingresa el slug de tu salón para continuar.</p>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!slug.trim()) return;
          void router.push(`/${slug.trim()}/login`);
        }}
      >
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ej: mi-salon"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-slate-950">
          Continuar
        </button>
      </form>
    </div>
  );
}
