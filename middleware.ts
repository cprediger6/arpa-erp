// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log(`🔍 [M1] Middleware: Iniciando para ${request.nextUrl.pathname}`);
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  const pathname = request.nextUrl.pathname;

  console.log(`🔍 [M2] Middleware: Token = ${token ? "✅ Existe" : "❌ No existe"}`);
  if (token) {
    console.log(`🔍 [M3] Middleware: Email = ${token.email}`);
    console.log(`🔍 [M4] Middleware: Role = ${token.role}`);
  }
  console.log(`🔍 [M5] Middleware: Pathname = ${pathname}`);

  // Rutas públicas
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.some(path => pathname === path)) {
    console.log(`🔓 [M6] Middleware: Ruta pública, permitiendo acceso`);
    return NextResponse.next();
  }

  // Rutas de API
  if (pathname.startsWith('/api/auth')) {
    console.log(`🔓 [M7] Middleware: API auth, permitiendo acceso`);
    return NextResponse.next();
  }

  // Si no hay token, redirigir a login
  if (!token) {
    console.log(`🔒 [M8] Middleware: No hay token, redirigiendo a login`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuario autenticado, permitir acceso
  console.log(`✅ [M9] Middleware: Usuario autenticado, permitiendo acceso a ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};