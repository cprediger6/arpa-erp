"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/sales/PaymentModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Mail, 
  Truck, 
  Loader2,
  DollarSign,
  User,
  Package,
  CreditCard,
  Edit,
  Trash2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import Link from "next/link";

interface SaleDetail {
  id: string;
  productId: string;
  product: { name: string; sku: string };
  variantId: string | null;
  variant: { name: string; value: string } | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  reference: string | null;
  paymentDate: string;
}

interface Sale {
  id: string;
  number: string;
  status: string;
  client: { name: string; email: string | null; phone: string | null; ruc: string | null };
  user: { name: string };
  saleDate: string;
  deliveryDate: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  details: SaleDetail[];
  payments: Payment[];
  createdAt: string;
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

function SaleDetailContent() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const isSalesRole = session?.user?.role === "SALES";
  const canModify = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

  useEffect(() => {
    const loadSale = async () => {
      try {
        const res = await fetch(`/api/sales/${params.id}`);
        if (!res.ok) throw new Error("Error al cargar venta");
        const data = await res.json();
        setSale(data);
        setSelectedStatus(data.status);
      } catch (error) {
        console.error(error);
        alert("Error al cargar la venta");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadSale();
    }
  }, [params.id]);

  const handleStatusChange = async () => {
    if (!sale) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/sales/${sale.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      const updated = await res.json();
      setSale({ ...sale, status: updated.status });
      setIsStatusDialogOpen(false);
      alert("Estado actualizado exitosamente");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!sale) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar venta");

      router.push("/sales");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la venta");
    } finally {
      setIsUpdating(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!sale) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sales/${sale.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cancelar venta");
      }

      const result = await res.json();
      setSale({ ...sale, status: "CANCELLED", notes: result.sale.notes });
      setIsCancelDialogOpen(false);
      alert("Venta cancelada exitosamente");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al cancelar la venta");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentSuccess = () => {
    const loadSale = async () => {
      try {
        const res = await fetch(`/api/sales/${params.id}`);
        if (!res.ok) throw new Error("Error al cargar venta");
        const data = await res.json();
        setSale(data);
        setSelectedStatus(data.status);
      } catch (error) {
        console.error(error);
      }
    };
    loadSale();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venta no encontrada</p>
        <Button className="mt-4" onClick={() => router.push("/sales")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white px-4 py-2 text-sm`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const canChangeStatus = canModify || (isSalesRole && sale.status !== "CANCELLED" && sale.status !== "COLLECTED");
  const canDelete = canModify && sale.status === "PENDING";
  const canCollect = canModify && (sale.status === "INVOICED" || sale.status === "DELIVERED");
  const canCancel = session?.user?.role === "ADMIN" && sale.status !== "CANCELLED" && sale.status !== "COLLECTED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/sales")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{sale.number}</h1>
            <p className="text-muted-foreground">
              Creada el {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Enviar
          </Button>
          {canCollect && (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Cobrar
            </Button>
          )}
          {canCancel && (
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Venta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar Venta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    ¿Estás seguro de cancelar la venta {sale.number}?
                    {sale.status !== "PENDING" && " Se restaurará el inventario."}
                  </p>
                  <div>
                    <Label htmlFor="cancellationReason">Motivo de cancelación</Label>
                    <Input
                      id="cancellationReason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Ingresa el motivo de la cancelación"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                      No, mantener
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        "Sí, cancelar"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canDelete && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Eliminar venta?</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground">
                  Esta acción no se puede deshacer. ¿Estás seguro de eliminar la venta {sale.number}?
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estado y acciones */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Estado:</span>
              {getStatusBadge(sale.status)}
            </div>
            <div className="flex gap-2">
              <Link href={`/sales/${sale.id}/edit`}>
                <Button variant="outline" size="sm" disabled={!canModify && isSalesRole}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              {canChangeStatus && (
                <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Truck className="h-4 w-4 mr-2" />
                      Cambiar Estado
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar Estado de Venta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="status">Nuevo Estado</Label>
                        <select
                          id="status"
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                        >
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleStatusChange} disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Actualizando...
                            </>
                          ) : (
                            "Actualizar"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la venta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{sale.client.name}</p>
            {sale.client.email && <p className="text-sm text-muted-foreground">{sale.client.email}</p>}
            {sale.client.phone && <p className="text-sm text-muted-foreground">Tel: {sale.client.phone}</p>}
            {sale.client.ruc && <p className="text-sm text-muted-foreground">RUC: {sale.client.ruc}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span className="text-red-500">-${sale.discount.toFixed(2)}</span>
            </div>
            
            {sale.taxRate && sale.taxRate > 0 && sale.taxAmount && sale.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {sale.taxName || "IVA"} ({sale.taxRate}%)
                </span>
                <span>${sale.taxAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>Total</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vendedor</span>
              <span>{sale.user.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de venta</span>
              <span>{format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: es })}</span>
            </div>
            {sale.deliveryDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha de entrega</span>
                <span>{format(new Date(sale.deliveryDate), "dd/MM/yyyy", { locale: es })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.details.map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{detail.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {detail.product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>{detail.variant?.value || "-"}</TableCell>
                  <TableCell className="text-right">{detail.quantity}</TableCell>
                  <TableCell className="text-right">${detail.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${detail.discount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${detail.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagos */}
      {sale.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.type}</TableCell>
                    <TableCell className="font-medium">${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.reference || "-"}</TableCell>
                    <TableCell>{format(new Date(payment.paymentDate), "dd/MM/yyyy", { locale: es })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {sale.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{sale.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cobro */}
      <PaymentModal
        saleId={sale.id}
        total={sale.total}
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

// ✅ Exportación correcta del componente
export default function SaleDetailPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES]}>
      <SaleDetailContent />
    </ProtectedRoute>
  );
}