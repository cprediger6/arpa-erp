"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Loader2,
  Award
} from "lucide-react";

interface DashboardData {
  summary: {
    totalSales: number;
    currentMonth: number;
    lastMonth: number;
    growth: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
  monthlySales: { month: string; value: number; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  statusCount: {
    PENDING: number;
    QUOTE: number;
    ORDER: number;
    RESERVED: number;
    INVOICED: number;
    DELIVERED: number;
    COLLECTED: number;
  };
  productivity: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    uniqueClients: number;
    conversionRate: number;
  };
  recentSales: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/sales/dashboard");
        if (!res.ok) throw new Error("Error al cargar dashboard");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error al cargar datos del dashboard</p>
      </div>
    );
  }

  const { summary, monthlySales, topProducts, statusCount, productivity } = data;
  const isSalesRole = session?.user?.role === "SALES";

  // ✅ Transformar datos para el gráfico de barras
  const barChartData = monthlySales.map(item => ({
    name: item.month,
    value: item.value,
  }));

  // ✅ Transformar datos para el gráfico de pastel
  const pieChartData = topProducts.map(item => ({
    name: item.name,
    value: item.quantity,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mi Dashboard</h1>
          <p className="text-muted-foreground">
            {isSalesRole 
              ? `Bienvenido, ${session?.user?.name || "Vendedor"} 👋`
              : `Bienvenido, ${session?.user?.name || "Usuario"}`
            }
          </p>
        </div>
        {isSalesRole && (
          <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2">
            <Award className="h-4 w-4 mr-2" />
            Vendedor
          </Badge>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalOrders} transacciones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.currentMonth.toFixed(2)}
            </div>
            <p className={`text-xs ${summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.growth >= 0 ? '↑' : '↓'} {Math.abs(summary.growth).toFixed(1)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivity.uniqueClients}</div>
            <p className="text-xs text-muted-foreground">
              Ticket promedio: ${productivity.averageTicket.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCount.PENDING}</div>
            <p className="text-xs text-muted-foreground">
              {summary.completedOrders} completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productividad del vendedor */}
      {isSalesRole && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Mi Productividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">{productivity.totalSales}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold">${productivity.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">${productivity.averageTicket.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                <p className="text-2xl font-bold">{productivity.conversionRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={barChartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={pieChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Estado de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Mis Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">Pendiente</Badge>
              <span className="font-bold">{statusCount.PENDING}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">Cotización</Badge>
              <span className="font-bold">{statusCount.QUOTE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500">Pedido</Badge>
              <span className="font-bold">{statusCount.ORDER}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500">Reservado</Badge>
              <span className="font-bold">{statusCount.RESERVED}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">Facturado</Badge>
              <span className="font-bold">{statusCount.INVOICED}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-500">Entregado</Badge>
              <span className="font-bold">{statusCount.DELIVERED}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500">Cobrado</Badge>
              <span className="font-bold">{statusCount.COLLECTED}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}