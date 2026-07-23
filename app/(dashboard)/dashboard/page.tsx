"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/charts";
import { Award } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Datos de ejemplo (después vendrán datos reales)
  const salesData = [
    { name: 'Ene', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Abr', value: 7000 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 8000 },
  ];

  const getRoleMessage = () => {
    switch (userRole) {
      case 'ADMIN':
        return 'Panel de administración completo';
      case 'SALES':
        return 'Panel de ventas - tus métricas';
      case 'PURCHASES':
        return 'Panel de compras';
      case 'WAREHOUSE':
        return 'Panel de inventario';
      case 'ACCOUNTING':
        return 'Panel de contabilidad';
      case 'SUPERVISOR':
        return 'Panel de supervisor';
      default:
        return 'Bienvenido';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {session?.user?.name || 'Usuario'} - {getRoleMessage()}
          </p>
        </div>
        {userRole === 'SALES' && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm flex items-center">
            <Award className="h-4 w-4 mr-2" />
            Vendedor
          </div>
        )}
        {userRole === 'ADMIN' && (
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm flex items-center">
            👑 Administrador
          </div>
        )}
      </div>

      {/* Tarjetas de resumen - solo las que corresponden al rol */}
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
            <CardTitle className="text-sm font-medium">
              {userRole === 'SALES' ? 'Mis Ventas' : 'Compras'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'SALES' ? '$32,886.22' : '$12,345.67'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'SALES' ? '+15.3% respecto al mes anterior' : '-5.2% respecto al mes anterior'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'WAREHOUSE' ? 'Stock Total' : 'Ganancias'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'WAREHOUSE' ? '1,234' : '$32,886.22'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'WAREHOUSE' ? '12 productos bajo mínimo' : '+15.3% respecto al mes anterior'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'SALES' ? 'Clientes Atendidos' : 'Stock Total'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'SALES' ? '45' : '1,234'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'SALES' ? '+12 nuevos este mes' : '12 productos bajo mínimo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos - solo los relevantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'SALES' ? 'Mis Ventas por Mes' : 'Ventas por Mes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={salesData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'SALES' ? 'Mis Productos Más Vendidos' : 'Productos Más Vendidos'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={[
              { name: 'Producto A', value: 400 },
              { name: 'Producto B', value: 300 },
              { name: 'Producto C', value: 200 },
              { name: 'Producto D', value: 100 },
            ]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}