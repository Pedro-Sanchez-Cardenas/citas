import clsx from 'clsx';

export default function Radio({ label, className, ...props }) {
  return (
    <label className={clsx('inline-flex items-center gap-2 text-xs text-slate-300', className)}>
      <input
        type="radio"
        className="h-4 w-4 rounded-full border-slate-600 bg-slate-900 text-teal-400 focus:ring-teal-500/60 focus:ring-offset-slate-950"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

