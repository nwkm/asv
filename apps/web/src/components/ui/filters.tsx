'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Input } from './ui';

/** URL-driven filter bar: edits query params and resets to page 1. */
export function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`);
  };
}

export function SearchBox({ placeholder }: { placeholder: string }) {
  const sp = useSearchParams();
  const set = useSetParams();
  const [v, setV] = useState(sp.get('search') ?? '');
  useEffect(() => {
    const t = setTimeout(
      () => v !== (sp.get('search') ?? '') && set({ search: v || undefined }),
      300,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
  return (
    <Input
      value={v}
      onChange={(e) => setV(e.target.value)}
      placeholder={placeholder}
      className="w-full sm:w-64"
      type="search"
    />
  );
}

export function ParamSelect({
  name,
  allLabel,
  options,
}: {
  name: string;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const sp = useSearchParams();
  const set = useSetParams();
  return (
    <select
      aria-label={name}
      value={sp.get(name) ?? ''}
      onChange={(e) => set({ [name]: e.target.value || undefined })}
      className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-card px-3 text-sm sm:flex-none"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ParamDate({ name, label }: { name: string; label: string }) {
  const sp = useSearchParams();
  const set = useSetParams();
  return (
    <label className="flex flex-1 items-center gap-2 text-sm text-muted sm:flex-none">
      {label}
      <input
        type="date"
        value={sp.get(name) ?? ''}
        onChange={(e) => set({ [name]: e.target.value || undefined })}
        className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-card px-2 text-sm text-ink sm:flex-none"
      />
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}
