// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log("🟢 Middleware ejecutado para:", request.nextUrl.pathname);
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  const pathname = request.nextUrl.pathname;

  console.log("🟢 Token:", token ? "Existe" : "No existe");
  console.log("🟢 Pathname:", pathname);

  // 1. Rutas públicas - siempre accesibles
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.some(path => pathname === path)) {
    console.log("🟢 Ruta pública, permitiendo acceso");
    return NextResponse.next();
  }

  // 2. Rutas de API - siempre accesibles
  if (pathname.startsWith('/api/auth')) {
    console.log("🟢 Ruta de API auth, permitiendo acceso");
    return NextResponse.next();
  }

  // 3. Verificar autenticación
  if (!token) {
    console.log("🔴 No hay token, redirigiendo a login");
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. ✅ Permitir acceso a /dashboard siempre que esté autenticado
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    console.log("🟢 Acceso a /dashboard permitido para:", token.email);
    return NextResponse.next();
  }

  // 5. Para otras rutas, verificar permisos
  console.log("🟢 Acceso permitido a:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};