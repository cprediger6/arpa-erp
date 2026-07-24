"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  console.log("📊 [D1] DashboardPage: Renderizando");
  
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log(`📊 [D2] DashboardPage: Status = ${status}`);
  console.log(`📊 [D3] DashboardPage: Session =`, session);

  useEffect(() => {
    console.log(`📊 [D4] DashboardPage useEffect: Status = ${status}`);
    
    if (status === "unauthenticated") {
      console.log("📊 [D5] DashboardPage: No autenticado, redirigiendo a login");
      router.push("/login");
    }
    
    if (status === "authenticated") {
      console.log("📊 [D6] DashboardPage: Autenticado correctamente!");
    }
  }, [status, router]);

  if (status === "loading") {
    console.log("📊 [D7] DashboardPage: Cargando...");
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    console.log("📊 [D8] DashboardPage: No hay sesión");
    return null;
  }

  console.log("📊 [D9] DashboardPage: Renderizando contenido");

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido, {session?.user?.name || 'Usuario'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345.67</div>
            <p className="text-xs text-muted-foreground">-5.2% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$32,886.22</div>
            <p className="text-xs text-muted-foreground">+15.3% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">12 productos bajo mínimo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}