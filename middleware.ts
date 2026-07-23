// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  const pathname = request.nextUrl.pathname;

  // Rutas públicas
  if (pathname === '/login' || pathname === '/register' || pathname === '/api/auth') {
    return NextResponse.next();
  }

  // Verificar autenticación
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',     // ✅ Coincide con la ruta real
    '/admin/:path*',
    '/products/:path*',
    '/inventory/:path*',
    '/sales/:path*',
    '/purchases/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};