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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500">Cargando ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error al cargar las ventas</p>
        <p className="text-sm">{error}</p>
        <Button variant="outline" className="mt-2" onClick={loadSales}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${summary.totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Impuestos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${summary.totalTax.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.statusCounts.PENDING}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Ventas</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSales}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => router.push("/sales/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay ventas registradas</p>
              <Button 
                variant="outline" 
                className="mt-4"
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
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.number}</TableCell>
                      <TableCell>{sale.client?.name || "Sin cliente"}</TableCell>
                      <TableCell>
                        {sale.saleDate ? format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", { locale: es }) : "-"}
                      </TableCell>
                      <TableCell>{sale.user?.name || "-"}</TableCell>
                      <TableCell>
                        {sale.taxRate && sale.taxRate > 0 ? (
                          <span className="text-sm">
                            {sale.taxName || "IVA"} ({sale.taxRate}%)
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${sale.total?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/sales/${sale.id}`)}
                        >
                          <Eye className="h-4 w-4" />
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