'use client';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { call } from '@/lib/client-api';
import { Input } from './ui';

export type ParticipantHit = {
  id: string;
  firstName: string;
  lastName: string;
  familyName: string | null;
  email: string | null;
  phone: string | null;
};

/** Async typeahead over /participants. Calls onPick with the full record. */
export function ParticipantSearch({
  placeholder,
  onPick,
  exclude = [],
  clearOnPick = false,
}: {
  placeholder: string;
  onPick: (p: ParticipantHit) => void;
  exclude?: string[];
  clearOnPick?: boolean;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<ParticipantHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await call<{ items: ParticipantHit[] }>(
          'GET',
          `/participants?pageSize=8&search=${encodeURIComponent(q.trim())}`,
        );
        setHits(res.items.filter((h) => !exclude.includes(h.id)));
        setActive(0);
        setOpen(true);
      } catch {
        setHits([]);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (h: ParticipantHit) => {
    onPick(h);
    setQ(clearOnPick ? '' : `${h.firstName} ${h.lastName}`);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <Search size={16} className="pointer-events-none absolute top-3 left-3 text-muted" />
      <Input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        value={q}
        placeholder={placeholder}
        className="pl-9"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, hits.length - 1));
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && open && hits[active]) {
            e.preventDefault();
            pick(hits[active]!);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && hits.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-card p-1 shadow-xl"
        >
          {hits.map((h, i) => (
            <li key={h.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(h)}
                className={`flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm ${i === active ? 'bg-forest-50' : ''}`}
              >
                <span className="font-medium">
                  {h.firstName} {h.lastName}
                </span>
                <span className="text-xs text-muted">
                  {[h.email, h.phone].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
