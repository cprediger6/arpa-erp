// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Definir qué roles pueden acceder a cada ruta
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'SUPERVISOR', 'SALES', 'PURCHASES', 'WAREHOUSE', 'ACCOUNTING', 'READ_ONLY'],
  '/products': ['ADMIN', 'SUPERVISOR', 'SALES', 'PURCHASES', 'WAREHOUSE'],
  '/categories': ['ADMIN', 'SUPERVISOR', 'SALES', 'PURCHASES', 'WAREHOUSE'],
  '/inventory': ['ADMIN', 'SUPERVISOR', 'WAREHOUSE'],
  '/clients': ['ADMIN', 'SUPERVISOR', 'SALES'],
  '/sales': ['ADMIN', 'SUPERVISOR', 'SALES'],
  '/purchases': ['ADMIN', 'SUPERVISOR', 'PURCHASES'],
  '/reports': ['ADMIN', 'SUPERVISOR', 'ACCOUNTING'],
  '/settings': ['ADMIN'],
  '/users': ['ADMIN'],
  '/companies': ['ADMIN'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  const pathname = request.nextUrl.pathname;

  // 1. Rutas públicas - siempre accesibles
  const publicPaths = ['/', '/login', '/register'];
  if (publicPaths.some(path => pathname === path)) {
    return NextResponse.next();
  }

  // 2. Rutas de API - siempre accesibles (la autenticación se verifica en la API)
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 3. Verificar autenticación
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Verificar permisos por rol
  const userRole = token.role as string;
  
  // Encontrar qué ruta coincide
  let matchedRoute = '';
  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      matchedRoute = route;
      break;
    }
  }

  // Si la ruta requiere permisos específicos
  if (matchedRoute) {
    const allowedRoles = routePermissions[matchedRoute];
    if (!allowedRoles.includes(userRole)) {
      // Si no tiene permiso, redirigir al dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};