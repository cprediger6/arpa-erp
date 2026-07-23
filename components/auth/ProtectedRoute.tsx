// components/auth/ProtectedRoute.tsx
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { Module } from "@/lib/auth/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  module: Module;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, module, fallback }: ProtectedRouteProps) {
  const { hasModule, userRole } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!userRole) {
      router.push("/login");
    }
  }, [userRole, router]);

  if (!userRole) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasModule(module)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">
            No tienes permisos para acceder a este módulo.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Tu rol actual es: {userRole}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}