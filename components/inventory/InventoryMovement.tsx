// components/inventory/InventoryMovement.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InventoryMovementProps {
  movements: any[];
}

export function InventoryMovement({ movements }: InventoryMovementProps) {
  const getStatusBadge = (type: string) => {
    const statusMap: Record<string, string> = {
      ENTRY: "success",
      EXIT: "destructive",
      TRANSFER: "warning",
      ADJUSTMENT: "secondary",
    };
    return statusMap[type] || "default";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Costo Unitario</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Referencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">No hay movimientos</TableCell>
          </TableRow>
        ) : (
          movements.map((movement, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(movement.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadge(movement.type) as any}>
                  {movement.type}
                </Badge>
              </TableCell>
              <TableCell>{movement.quantity}</TableCell>
              <TableCell>${movement.unitCost}</TableCell>
              <TableCell>${movement.totalCost}</TableCell>
              <TableCell>{movement.reference || "-"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}