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

  console.log("🔍 Middleware - Pathname:", pathname);
  console.log("🔍 Middleware - Token existe:", !!token);

  // 1. Rutas públicas - siempre accesibles
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.some(path => pathname === path)) {
    console.log("🔓 Ruta pública, permitiendo acceso");
    return NextResponse.next();
  }

  // 2. Rutas de API - siempre accesibles
  if (pathname.startsWith('/api/auth')) {
    console.log("🔓 API auth, permitiendo acceso");
    return NextResponse.next();
  }

  // 3. Si no hay token, redirigir a login
  if (!token) {
    console.log("🔒 No hay token, redirigiendo a login");
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. ✅ Para usuarios autenticados, permitir TODAS las rutas
  console.log("✅ Usuario autenticado, permitiendo acceso a:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};