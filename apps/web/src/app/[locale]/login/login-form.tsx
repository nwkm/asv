'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Button, Field, Input } from '@/components/ui/ui';

export function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(false);
    const res = await authClient.signIn.email({
      email: String(f.get('email')),
      password: String(f.get('password')),
    });
    setBusy(false);
    if (res.error) return setError(true);
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rise w-full max-w-sm space-y-5">
      <div>
        <h2 className="text-4xl font-semibold text-forest-900">{t('title')}</h2>
        <p className="mt-1 text-muted">{t('subtitle')}</p>
      </div>
      <Field label={t('email')}>
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label={t('password')}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {t('invalid')}
        </p>
      )}
      <Button type="submit" disabled={busy} className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
