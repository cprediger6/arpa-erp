// components/inventory/InventoryMovement.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

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
            <TableHead>Depósito Origen</TableHead>
            <TableHead>Depósito Destino</TableHead>
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
            const isTransfer = movement.type === "TRANSFER";
            
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
                  {isTransfer ? (
                    <span className="text-orange-600 font-medium">
                      {movement.sourceWarehouse?.name || movement.inventoryItem?.warehouse?.name || "-"}
                    </span>
                  ) : (
                    movement.inventoryItem?.warehouse?.name || "-"
                  )}
                </TableCell>
                <TableCell>
                  {isTransfer ? (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {movement.targetWarehouse?.name || "-"}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
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