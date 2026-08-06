// components/inventory/KardexTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface KardexTableProps {
  data: any[];
}

export function KardexTable({ data }: KardexTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Entrada</TableHead>
          <TableHead>Salida</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Costo Unitario</TableHead>
          <TableHead>Costo Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">No hay registros en el Kardex</TableCell>
          </TableRow>
        ) : (
          data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
              <TableCell>{item.quantityIn || "-"}</TableCell>
              <TableCell>{item.quantityOut || "-"}</TableCell>
              <TableCell>{item.balance}</TableCell>
              <TableCell>${item.unitCost}</TableCell>
              <TableCell>${item.balanceCost}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}