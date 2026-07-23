"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles = [], fallback }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Verificar roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600 mt-2">
          No tienes permisos para acceder a esta página.
        </p>
        <p className="text-sm text-gray-500">
          Tu rol: {session.user.role}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}