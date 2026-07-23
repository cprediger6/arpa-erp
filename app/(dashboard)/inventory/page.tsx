"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryMovement } from "@/components/inventory/InventoryMovement";
import { KardexTable } from "@/components/inventory/KardexTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Truck, AlertTriangle } from "lucide-react";

export default function InventoryPage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  // Si no se usa setSelectedProduct, usar:
  // const [, setSelectedProduct] = useState<string | null>(null);

  const { data: inventory } = useQuery({
    queryKey: ["inventory", selectedProduct],
    queryFn: async () => {
      const url = selectedProduct 
        ? `/api/inventory?productId=${selectedProduct}`
        : "/api/inventory";
      const response = await fetch(url);
      return response.json();
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InventoryCard
          title="Stock Total"
          value={inventory?.totalStock || 0}
          icon={<Truck className="h-6 w-6" />}
        />
        <InventoryCard
          title="Stock Disponible"
          value={inventory?.availableStock || 0}
          icon={<RefreshCw className="h-6 w-6" />}
        />
        <InventoryCard
          title="Stock Reservado"
          value={inventory?.reservedStock || 0}
          icon={<AlertTriangle className="h-6 w-6" />}
        />
        <InventoryCard
          title="Stock en Tránsito"
          value={inventory?.transitStock || 0}
          icon={<Truck className="h-6 w-6" />}
        />
      </div>

      <Tabs defaultValue="movements" className="w-full">
        <TabsList>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="cycles">Conteos</TabsTrigger>
        </TabsList>
        <TabsContent value="movements">
          <InventoryMovement movements={inventory?.movements || []} />
        </TabsContent>
        <TabsContent value="kardex">
          <KardexTable data={inventory?.kardex || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}