export interface ProfileCardProps {
  name: string;
  email: string;
}

export default function ProfileCard({ name, email }: ProfileCardProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
      <p>
        <span className="text-slate-400">Nombre:</span> {name || '—'}
      </p>
      <p className="mt-2">
        <span className="text-slate-400">Email:</span> {email || '—'}
      </p>
    </div>
  );
}

