import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);
const SESSION_COOKIES = ['better-auth.session_token', '__Secure-better-auth.session_token'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = pathname.match(/^\/(en|fr)(\/.*)?$/);
  const isLogin = m && (m[2] ?? '').startsWith('/login');
  const authed = SESSION_COOKIES.some((c) => req.cookies.has(c));
  if (m && !isLogin && !authed) {
    return NextResponse.redirect(new URL(`/${m[1]}/login`, req.url));
  }
  return intl(req);
}

export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
