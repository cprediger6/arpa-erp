// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas públicas
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.some(path => pathname === path)) {
    return NextResponse.next();
  }

  // Rutas de API públicas
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Verificar autenticación por cookie
  const sessionCookie = request.cookies.get('next-auth.session-token');
  
  if (!sessionCookie && !pathname.startsWith('/_next')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (API routes de autenticación)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};