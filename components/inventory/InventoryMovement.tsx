// components/inventory/InventoryMovement.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Movement {
  id: string;
  type: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string | null;
  description: string | null;
  createdAt: string;
  user: {
    name: string;
    lastName: string;
  };
  inventoryItem: {
    product: {
      name: string;
    };
    warehouse: {
      name: string;
    };
    variant?: {
      name: string;
      value: string;
    };
  };
  sourceWarehouse?: {
    name: string;
  };
  targetWarehouse?: {
    name: string;
  };
}

interface InventoryMovementProps {
  movements: Movement[];
}

export function InventoryMovement({ movements }: InventoryMovementProps) {
  const getMovementTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
      ENTRY: { label: "Entrada", variant: "success" },
      EXIT: { label: "Salida", variant: "destructive" },
      TRANSFER: { label: "Transferencia", variant: "warning" },
      ADJUSTMENT: { label: "Ajuste", variant: "secondary" },
      RESERVATION: { label: "Reserva", variant: "warning" },
      RELEASE: { label: "Liberación", variant: "default" },
    };
    return types[type] || { label: type, variant: "secondary" };
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ENTRY: "Entrada",
      EXIT: "Salida",
      TRANSFER: "Transferencia",
      ADJUSTMENT: "Ajuste",
      RESERVATION: "Reserva",
      RELEASE: "Liberación",
    };
    return labels[type] || type;
  };

  if (movements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay movimientos registrados</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Depósito</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Costo Unitario</TableHead>
            <TableHead>Costo Total</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const badge = getMovementTypeBadge(movement.type);
            return (
              <TableRow key={movement.id}>
                <TableCell className="text-sm">
                  {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge variant={badge.variant}>
                    {badge.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {movement.inventoryItem?.product?.name || "Producto no disponible"}
                </TableCell>
                <TableCell>
                  {movement.inventoryItem?.warehouse?.name || "Depósito no disponible"}
                </TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell>${movement.unitCost?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>${movement.totalCost?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>{movement.reference || "-"}</TableCell>
                <TableCell>
                  {movement.user ? `${movement.user.name} ${movement.user.lastName}` : "Sistema"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}