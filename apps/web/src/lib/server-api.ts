import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';

const API = process.env.API_URL ?? 'http://localhost:4000';

export type SessionUser = { id: string; name: string; email: string; role: string | null };

async function cookieHeader() {
  return (await cookies()).toString();
}

/** Server-side GET to the NestJS API, forwarding the user's session cookie. */
export async function api<T>(path: string, locale = 'fr'): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    headers: { cookie: await cookieHeader() },
    cache: 'no-store',
  });
  if (res.status === 401) redirect(`/${locale}/login`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const res = await fetch(`${API}/api/auth/get-session`, {
    headers: { cookie: await cookieHeader() },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: SessionUser } | null;
  return data?.user ?? null;
});

export const qs = (params: Record<string, string | number | undefined | null>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : '';
};
