// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROLE_PERMISSIONS, MODULES, Module } from '@/lib/auth/roles';

// Mapeo de rutas a módulos
const routeModuleMap: Record<string, Module> = {
  '/dashboard': MODULES.DASHBOARD,
  '/products': MODULES.PRODUCTS,
  '/categories': MODULES.PRODUCTS,
  '/inventory': MODULES.INVENTORY,
  '/clients': MODULES.CLIENTS,
  '/sales': MODULES.SALES,
  '/purchases': MODULES.PURCHASES,
  '/reports': MODULES.REPORTS,
  '/settings': MODULES.SETTINGS,
  '/users': MODULES.USERS,
  '/companies': MODULES.COMPANIES,
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
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

  // Verificar autenticación
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos por módulo
  const userRole = token.role as string;
  const allowedModules = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];

  // Encontrar el módulo de la ruta actual
  let currentModule: Module | undefined;
  for (const [route, module] of Object.entries(routeModuleMap)) {
    if (pathname.startsWith(route)) {
      currentModule = module;
      break;
    }
  }

  // Si la ruta requiere un módulo y el usuario no tiene acceso
  if (currentModule && !allowedModules.includes(currentModule)) {
    // Si es ADMIN, redirigir al dashboard, sino al login
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};