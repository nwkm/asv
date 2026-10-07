'use client';
import clsx from 'clsx';
import { CalendarDays, X } from 'lucide-react';
import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-forest-700 text-white hover:bg-forest-900 shadow-sm',
  secondary: 'bg-card text-ink border border-line hover:border-forest-600',
  ghost: 'text-ink hover:bg-forest-50',
  danger: 'bg-danger text-white hover:opacity-90',
};

export function Button({
  variant = 'primary',
  className,
  ...p
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...p}
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    />
  );
}

const inputCls =
  'h-10 w-full rounded-lg border border-line bg-card px-3 text-sm placeholder:text-muted/70 focus:border-forest-600 aria-[invalid=true]:border-danger';

export function Input({ className, ...p }: ComponentProps<'input'>) {
  return <input {...p} className={clsx(inputCls, className)} />;
}
export function Select({ className, ...p }: ComponentProps<'select'>) {
  return <select {...p} className={clsx(inputCls, 'pr-8', className)} />;
}
export function Textarea({ className, ...p }: ComponentProps<'textarea'>) {
  return <textarea {...p} className={clsx(inputCls, 'h-auto py-2', className)} />;
}

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx('block space-y-1.5', className)}>
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

export function Card({ className, ...p }: ComponentProps<'div'>) {
  return (
    <div
      {...p}
      className={clsx(
        'rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)]',
        className,
      )}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="rise mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}

export function Badge({
  children,
  tone = 'forest',
}: {
  children: ReactNode;
  tone?: 'forest' | 'clay' | 'ochre' | 'slate';
}) {
  const tones = {
    forest: 'bg-forest-100 text-forest-900',
    clay: 'bg-clay-500/15 text-clay-600',
    ochre: 'bg-ochre-500/20 text-[#7a5a14]',
    slate: 'bg-ink/10 text-ink',
  };
  return (
    <span
      className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}
    >
      {children}
    </span>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl"
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between">
            <h2 id={titleId} className="text-2xl font-semibold text-forest-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 hover:bg-forest-50"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-xl border border-line bg-paper p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-9 min-w-24 rounded-lg px-4 text-sm font-medium transition',
            value === o.value ? 'bg-forest-700 text-white shadow' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** DD/MM/YYYY text input with auto-slashes and a native date picker button. */
export function DateField({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const mask = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
  };
  const iso = /^(\d{2})\/(\d{2})\/(\d{4})$/.test(value) ? value.split('/').reverse().join('-') : '';
  return (
    <div className="relative">
      <Input
        value={value}
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        aria-invalid={invalid}
        onChange={(e) => onChange(mask(e.target.value))}
        className="pr-10"
      />
      <button
        type="button"
        aria-label="Pick a date"
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted hover:text-forest-700"
        onClick={() => picker.current?.showPicker?.()}
      >
        <CalendarDays size={16} />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={iso}
        onChange={(e) => e.target.value && onChange(e.target.value.split('-').reverse().join('/'))}
        className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-muted">{children}</p>;
}

/**
 * Responsive table: a normal table from `md` up; on smaller screens every row becomes a card and each
 * cell shows its header via `data-label`. Borders live on rows (not cells) so the last row stays clean.
 */
export const tableCls = {
  wrap: 'rounded-2xl border border-line bg-card md:overflow-x-auto',
  table: 'w-full text-sm max-md:block',
  thead: 'max-md:sr-only',
  tbody: 'max-md:block',
  tr: 'transition-colors hover:bg-forest-50/40 md:border-b md:border-line/60 md:last:border-b-0 max-md:block max-md:border-b max-md:border-line max-md:px-4 max-md:py-3 max-md:last:border-b-0',
  th: 'whitespace-nowrap border-b border-line bg-forest-50/60 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase',
  td: 'px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1.5 max-md:text-right before:text-left before:text-xs before:font-semibold before:tracking-wide before:text-muted before:uppercase before:content-[attr(data-label)] md:before:hidden',
};
