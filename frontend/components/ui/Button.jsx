import clsx from 'clsx';

const baseClasses =
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70';

const variants = {
  primary:
    'bg-linear-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white shadow-[0_16px_45px_rgba(8,47,73,0.9)] hover:brightness-110 focus-visible:ring-teal-400',
  subtle:
    'border border-slate-700/80 bg-slate-900/70 text-slate-100 hover:bg-slate-800/90 focus-visible:ring-slate-500',
  ghost:
    'text-slate-200 hover:bg-slate-900/70 focus-visible:ring-slate-500',
  danger:
    'border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 focus-visible:ring-red-400',
  outline:
    'border border-slate-700/80 bg-transparent text-slate-100 hover:bg-slate-900/70 focus-visible:ring-slate-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-2xl',
  full: 'w-full px-4 py-2.5 text-sm rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  const sizeKey = variant === 'primary' && size === 'full' ? 'full' : size;

  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[sizeKey], className)}
      {...props}
    >
      {children}
    </button>
  );
}

