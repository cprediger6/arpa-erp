// app/(dashboard)/sales/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Plus, Search, Loader2, Truck, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Sale {
  id: string;
  number: string;
  status: string;
  client: { name: string };
  user: { name: string };
  total: number;
  createdAt: string;
  details: any[];
  payments: any[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500",
  QUOTE: "bg-blue-500",
  ORDER: "bg-purple-500",
  RESERVED: "bg-orange-500",
  INVOICED: "bg-green-500",
  DELIVERED: "bg-teal-500",
  COLLECTED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  QUOTE: "Cotización",
  ORDER: "Pedido",
  RESERVED: "Reservado",
  INVOICED: "Facturado",
  DELIVERED: "Entregado",
  COLLECTED: "Cobrado",
  CANCELLED: "Cancelado",
};

export default function SalesPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sales");
      if (!res.ok) throw new Error("Error al cargar ventas");
      const data = await res.json();
      setSales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las ventas de tu empresa
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.reduce((acc, sale) => acc + sale.total, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {sales.length} transacciones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.filter(s => s.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.filter(s => s.status === "INVOICED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sales.filter(s => s.status === "DELIVERED" || s.status === "COLLECTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cargando ventas...
                    </p>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2">No hay ventas registradas</p>
                    <p className="text-sm">Crea tu primera venta para empezar</p>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.number}</TableCell>
                    <TableCell>{sale.client.name}</TableCell>
                    <TableCell>
                      {format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>${sale.total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>{sale.user.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}