"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { 
  Download, 
  Printer, 
  Loader2, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  TrendingDown,
  EyeOff
} from "lucide-react";

interface DashboardData {
  summary: {
    totalSales: number;
    totalPurchases: number;
    profit: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  monthlySales: { name: string; value: number; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  slowProducts: { name: string; quantity: number; total: number }[];
  statusCount: {
    PENDING: number;
    COLLECTED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
  lowStockProducts: { name: string; sku: string; stock: number }[];
  highStockProducts: { name: string; sku: string; stock: number }[];
  inventoryTrend: { name: string; value: number; count: number }[];
  recentSales: any[];
  enabledReports: {
    sales: boolean;
    purchases: boolean;
    inventory: boolean;
    profit: boolean;
    clients: boolean;
    suppliers: boolean;
    tax: boolean;
    products: boolean;
  };
}

function ReportsContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/reports/dashboard");
        if (!res.ok) throw new Error("Error al cargar reportes");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error(error);
        setError("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>{error || "No se pudieron cargar los datos"}</p>
      </div>
    );
  }

  const { summary, monthlySales, topProducts, slowProducts, statusCount, lowStockProducts, highStockProducts, inventoryTrend, enabledReports } = data;

  // Verificar qué reportes están habilitados
  const showSales = enabledReports?.sales !== false;
  const showPurchases = enabledReports?.purchases !== false;
  const showInventory = enabledReports?.inventory !== false;
  const showProducts = enabledReports?.products !== false;

  // Transformar datos para gráficos
  const barChartData = monthlySales.map(item => ({
    name: item.name,
    value: item.value,
  }));

  const pieChartData = topProducts.length > 0 
    ? topProducts.map(item => ({ name: item.name, value: item.quantity }))
    : [{ name: "Sin datos", value: 1 }];

  const lineChartData = inventoryTrend.map(item => ({
    name: item.name,
    value: item.value,
  }));

  const slowProductsData = slowProducts.length > 0
    ? slowProducts.map(item => ({ name: item.name, value: item.quantity }))
    : [{ name: "Sin datos", value: 1 }];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
          <p className="text-muted-foreground">
            Dashboard ejecutivo con métricas clave de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {session?.user?.role === "ADMIN" ? "👑 Administrador" : "📊 Contabilidad"}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* KPI Cards - Solo mostrar si están habilitados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {showSales && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalOrders} transacciones
              </p>
            </CardContent>
          </Card>
        )}
        {showPurchases && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalPurchases.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalOrders} órdenes
              </p>
            </CardContent>
          </Card>
        )}
        {showSales && showPurchases && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganancias</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.profit.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.profit > 0 ? "Positivo" : "Negativo"}
              </p>
            </CardContent>
          </Card>
        )}
        {showSales && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                {summary.completedOrders} completadas
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estado de Ventas - Solo si ventas está habilitado */}
      {showSales && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500">Pendiente</Badge>
                <span className="font-bold">{statusCount.PENDING}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">Entregado</Badge>
                <span className="font-bold">{statusCount.DELIVERED}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Cobrado</Badge>
                <span className="font-bold">{statusCount.COLLECTED}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">Cancelado</Badge>
                <span className="font-bold">{statusCount.CANCELLED}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showSales && (
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlySales.some(m => m.value > 0) ? (
                <BarChart data={barChartData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de ventas
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {showProducts && (
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <PieChart data={pieChartData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay productos vendidos
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showProducts && (
          <Card>
            <CardHeader>
              <CardTitle>Productos Lentos</CardTitle>
            </CardHeader>
            <CardContent>
              {slowProducts.length > 0 ? (
                <PieChart data={slowProductsData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay productos lentos
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {showInventory && (
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryTrend.some(i => i.value > 0) ? (
                <LineChart data={lineChartData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de inventario
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stock crítico y alto - Solo si inventario está habilitado */}
      {showInventory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Stock Crítico
              </CardTitle>
              <Badge variant="destructive">{lowStockProducts.length}</Badge>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {lowStockProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="destructive">Stock: {product.stock}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  ✅ Todos los productos con stock adecuado
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Stock Alto
              </CardTitle>
              <Badge variant="success">{highStockProducts.length}</Badge>
            </CardHeader>
            <CardContent>
              {highStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {highStockProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="success">Stock: {product.stock}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay productos con stock alto
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensaje si todos los reportes están deshabilitados */}
      {!showSales && !showPurchases && !showInventory && !showProducts && (
        <Card>
          <CardContent className="text-center py-12">
            <EyeOff className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No hay reportes habilitados</p>
            <p className="text-sm text-muted-foreground">
              Ve a Configuración → Reportes para habilitar los reportes que deseas ver
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTING]}>
      <ReportsContent />
    </ProtectedRoute>
  );
}