// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ✅ Rutas públicas y de API de autenticación
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ✅ Verificar la cookie de sesión
  const sessionCookie = request.cookies.get('__Secure-next-auth.session-token') || 
                        request.cookies.get('next-auth.session-token');

  if (!sessionCookie && !pathname.startsWith('/_next')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};