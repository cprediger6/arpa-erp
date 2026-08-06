// app/(dashboard)/dashboard/page.tsx
"use client";

// 1. FORZAR RENDERIZADO DINÁMICO PARA EVITAR CACHE DE VERCEL
export const dynamic = "force-dynamic"; 

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Loader2,
  AlertCircle,
  Package,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

function NoDataMessage({ message = "No hay información disponible aún" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 md:h-64 text-center">
      <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mb-3 md:mb-4" />
      <p className="text-gray-500 text-base md:text-lg">{message}</p>
      <p className="text-xs md:text-sm text-gray-400 mt-1">
        Comienza a agregar datos para ver estadísticas aquí
      </p>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  subtitleColor
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  subtitle?: string;
  subtitleColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg md:text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className={`text-[10px] md:text-xs ${subtitleColor || 'text-muted-foreground'}`}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("📊 Cargando dashboard...");
        const res = await fetch("/api/sales/dashboard");
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const result = await res.json();
        console.log("📊 Datos recibidos:", result);
        console.log("📊 Summary:", result.summary);
        console.log("📊 Total ventas:", result.summary?.totalSales);
        
        setData(result);
      } catch (error) {
        console.error("❌ Error al cargar dashboard:", error);
        setError("No se pudieron cargar los datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] md:min-h-screen">
        <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 md:py-12">
              <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-3 md:mb-4" />
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Error al cargar el dashboard</h2>
              <p className="text-sm md:text-base text-gray-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si hay datos
  const hasRealData = data && 
    data.summary && 
    typeof data.summary.totalSales === 'number' && 
    data.summary.totalSales > 0;

  console.log("🔍 hasRealData:", hasRealData);
  console.log("🔍 data.summary:", data?.summary);

  // Si no hay datos, mostrar mensaje
  if (!hasRealData || !data) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Bienvenido, {session?.user?.name || 'Usuario'}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 text-[10px] md:text-sm px-3 py-1 md:px-4 md:py-2">
            <Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            {session?.user?.companyName || "Mi Empresa"}
          </Badge>
        </div>

        {/* Tarjetas vacías - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryCard title="Ventas Totales" value="$0" icon={DollarSign} subtitle="Sin datos" />
          <SummaryCard title="Este Mes" value="$0" icon={TrendingUp} subtitle="Sin datos" />
          <SummaryCard title="Clientes Únicos" value="0" icon={Users} subtitle="Sin datos" />
          <SummaryCard title="Pendientes" value="0" icon={Clock} subtitle="Sin datos" />
        </div>

        {/* Mensaje principal sin datos - Responsive */}
        <Card>
          <CardContent className="pt-6">
            <NoDataMessage message="Bienvenido a tu panel de control" />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-center">
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 md:h-8 md:w-8 mx-auto text-blue-600 mb-2" />
                <h3 className="text-sm md:text-base font-medium">Agrega Productos</h3>
                <p className="text-xs md:text-sm text-gray-500">Crea tu catálogo de productos</p>
              </div>
              <div className="p-3 md:p-4 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-600 mb-2" />
                <h3 className="text-sm md:text-base font-medium">Registra Clientes</h3>
                <p className="text-xs md:text-sm text-gray-500">Añade tus primeros clientes</p>
              </div>
              <div className="p-3 md:p-4 bg-purple-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-600 mb-2" />
                <h3 className="text-sm md:text-base font-medium">Crea Ventas</h3>
                <p className="text-xs md:text-sm text-gray-500">Comienza a facturar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay datos, mostrar el dashboard completo
  const { summary, monthlySales, topProducts, statusCount, productivity } = data;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Bienvenido, {session?.user?.name || "Usuario"} 👋
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 text-[10px] md:text-sm px-3 py-1 md:px-4 md:py-2">
          <Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          {session?.user?.companyName || "Mi Empresa"}
        </Badge>
      </div>

      {/* Tarjetas de resumen - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard 
          title="Ventas Totales" 
          value={`$${summary.totalSales.toFixed(2)}`} 
          icon={DollarSign}
          subtitle={`${summary.totalOrders} transacciones`}
        />
        <SummaryCard 
          title="Este Mes" 
          value={`$${summary.currentMonth.toFixed(2)}`} 
          icon={TrendingUp}
          subtitle={`${summary.growth >= 0 ? '↑' : '↓'} ${Math.abs(summary.growth).toFixed(1)}% vs mes anterior`}
          subtitleColor={summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <SummaryCard 
          title="Clientes Únicos" 
          value={productivity.uniqueClients} 
          icon={Users}
          subtitle={`Ticket promedio: $${productivity.averageTicket.toFixed(2)}`}
        />
        <SummaryCard 
          title="Pendientes" 
          value={statusCount.PENDING} 
          icon={Clock}
          subtitle={`${summary.completedOrders} completadas`}
        />
      </div>

      {/* Gráficos - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Ventas por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthlySales && monthlySales.length > 0 ? (
                monthlySales.map((item, index) => {
                  const maxValue = Math.max(...monthlySales.map(m => m.value));
                  return (
                    <div key={index} className="flex items-center gap-1 md:gap-2">
                      <span className="w-8 md:w-12 text-[10px] md:text-sm font-medium">{item.month}</span>
                      <div className="flex-1 h-6 md:h-8 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded transition-all duration-500"
                          style={{ 
                            width: `${maxValue > 0 ? Math.max((item.value / maxValue) * 100, 5) : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-[10px] md:text-sm font-mono">${item.value.toFixed(0)}</span>
                    </div>
                  );
                })
              ) : (
                <NoDataMessage message="No hay ventas registradas" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProducts && topProducts.length > 0 ? (
                <>
                  {/* Versión móvil: mostrar solo 5 productos */}
                  <div className="block sm:hidden">
                    {topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{index + 1}.</span>
                          <span className="text-xs truncate max-w-[80px]">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500">{product.quantity} und</span>
                          <span className="text-[10px] font-mono font-medium">${product.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    {topProducts.length > 5 && (
                      <p className="text-xs text-gray-400 text-center mt-2">
                        +{topProducts.length - 5} productos más
                      </p>
                    )}
                  </div>
                  
                  {/* Versión desktop: mostrar todos */}
                  <div className="hidden sm:block">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{index + 1}.</span>
                          <span className="text-sm">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">{product.quantity} unidades</span>
                          <span className="text-sm font-mono font-medium">${product.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <NoDataMessage message="No hay productos vendidos" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de ventas - Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Estado de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-yellow-500 text-[8px] md:text-xs px-1 md:px-2">Pendiente</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.PENDING}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-blue-500 text-[8px] md:text-xs px-1 md:px-2">Cotización</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.QUOTE}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-purple-500 text-[8px] md:text-xs px-1 md:px-2">Pedido</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.ORDER}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-green-500 text-[8px] md:text-xs px-1 md:px-2">Facturado</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.INVOICED}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-teal-500 text-[8px] md:text-xs px-1 md:px-2">Entregado</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.DELIVERED}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Badge className="bg-emerald-500 text-[8px] md:text-xs px-1 md:px-2">Cobrado</Badge>
              <span className="text-sm md:text-base font-bold">{statusCount.COLLECTED}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de productividad - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{productivity.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${productivity.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">${productivity.averageTicket.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Tasa de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{productivity.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}