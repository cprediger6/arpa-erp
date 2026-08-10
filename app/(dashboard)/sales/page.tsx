// app/(dashboard)/sales/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Loader2, RefreshCw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Sale {
  id: string;
  number: string;
  status: string;
  saleDate: string;
  total: number;
  tax: number;
  taxName: string;
  taxRate: number;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    ruc: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  details: any[];
  payments: any[];
}

function SalesListContent() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalTax: 0,
    statusCounts: {
      PENDING: 0,
      COLLECTED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    }
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales?limit=100");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al cargar ventas");
      }
      
      const result = await res.json();
      console.log("📦 Datos recibidos:", result);
      
      const salesData = Array.isArray(result?.data) ? result.data : [];
      setSales(salesData);
      
      setSummary({
        totalSales: result?.summary?.totalSales || 0,
        totalAmount: result?.summary?.totalAmount || 0,
        totalTax: result?.summary?.totalTax || 0,
        statusCounts: {
          PENDING: result?.summary?.statusCounts?.PENDING || 0,
          COLLECTED: result?.summary?.statusCounts?.COLLECTED || 0,
          DELIVERED: result?.summary?.statusCounts?.DELIVERED || 0,
          CANCELLED: result?.summary?.statusCounts?.CANCELLED || 0,
        }
      });
      
      console.log(`✅ ${salesData.length} ventas cargadas`);
    } catch (error) {
      console.error("❌ Error al cargar ventas:", error);
      setError(error instanceof Error ? error.message : "Error al cargar ventas");
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "text-yellow-600 bg-yellow-50",
      COLLECTED: "text-green-600 bg-green-50",
      DELIVERED: "text-blue-600 bg-blue-50",
      CANCELLED: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pendiente",
      COLLECTED: "Cobrada",
      DELIVERED: "Entregada",
      CANCELLED: "Cancelada",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm sm:text-base">Cargando ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-3 sm:m-4 text-red-700">
        <p className="font-medium text-sm sm:text-base">Error al cargar las ventas</p>
        <p className="text-xs sm:text-sm">{error}</p>
        <Button variant="outline" className="mt-2 text-sm" onClick={loadSales}>
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Resumen - Grid responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-lg sm:text-2xl font-bold">{summary.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Monto Total</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-lg sm:text-2xl font-bold">${summary.totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Impuestos</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-lg sm:text-2xl font-bold">${summary.totalTax.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-lg sm:text-2xl font-bold">{summary.statusCounts.PENDING}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <CardTitle className="text-lg sm:text-xl">Lista de Ventas</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSales}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Actualizar</span>
              <span className="xs:hidden">Act.</span>
            </Button>
            <Button 
              onClick={() => router.push("/sales/new")}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Nueva Venta</span>
              <span className="xs:hidden">Nueva</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-3 sm:pb-4">
          {sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500 px-4">
              <p className="text-sm sm:text-base">No hay ventas registradas</p>
              <Button 
                variant="outline" 
                className="mt-4 text-sm"
                onClick={() => router.push("/sales/new")}
              >
                Crear primera venta
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Número</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell text-xs sm:text-sm">Fecha</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs sm:text-sm">Vendedor</TableHead>
                    <TableHead className="hidden xl:table-cell text-xs sm:text-sm">Impuesto</TableHead>
                    <TableHead className="text-xs sm:text-sm">Total</TableHead>
                    <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-3">
                        {sale.number}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm py-2 sm:py-3 max-w-[100px] truncate">
                        {sale.client?.name || "Sin cliente"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm py-2 sm:py-3">
                        {sale.saleDate ? format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: es }) : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs sm:text-sm py-2 sm:py-3">
                        {sale.user?.name || "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs sm:text-sm py-2 sm:py-3">
                        {sale.taxRate && sale.taxRate > 0 ? (
                          <span className="text-xs">
                            {sale.taxName || "IVA"} ({sale.taxRate}%)
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-xs sm:text-sm py-2 sm:py-3">
                        ${sale.total?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="py-2 sm:py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(sale.status)} whitespace-nowrap`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2 sm:py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/sales/${sale.id}`)}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalesPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES]}>
      <SalesListContent />
    </ProtectedRoute>
  );
}