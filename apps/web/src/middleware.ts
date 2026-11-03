import { resolveLocale, supportedLocales } from '@sentio/i18n/core';
import { type NextRequest, NextResponse } from 'next/server';

/** Redirige las rutas sin prefijo de idioma a /es o /en según la cookie o Accept-Language. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = supportedLocales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();

  const accept = request.headers.get('accept-language') ?? '';
  const locale = resolveLocale([
    request.cookies.get('NEXT_LOCALE')?.value,
    ...accept.split(',').map((part) => part.split(';')[0]),
  ]);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
