// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth/auth.config";

// Inicializamos el Middleware consumiendo únicamente la configuración compatible con Edge
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // El matcher protege de forma global exceptuando archivos estáticos, imágenes, rutas de la API de auth y favicon
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|api).*)"],
};