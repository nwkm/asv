'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from './client-api';

/** Runs an API mutation with toast feedback and a server-data refresh. */
export function useAction() {
  const t = useTranslations('common');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  /** Resolves to `{ data }` on success and `undefined` on failure (so 204 responses are still detectable). */
  async function run<T>(fn: () => Promise<T>, okMsg?: string): Promise<{ data: T } | undefined> {
    setBusy(true);
    try {
      const r = await fn();
      toast.success(okMsg ?? t('saved'));
      router.refresh();
      return { data: r };
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('error'));
    } finally {
      setBusy(false);
    }
  }
  return { run, busy };
}
