// app/(dashboard)/purchases/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function PurchasesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compras</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Módulo de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo está en construcción. Próximamente podrás gestionar:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>Órdenes de compra</li>
            <li>Proveedores</li>
            <li>Recepción de mercancía</li>
            <li>Facturación de compras</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}