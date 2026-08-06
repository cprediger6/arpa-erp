// app/(dashboard)/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryMovement } from "@/components/inventory/InventoryMovement";
import { KardexTable } from "@/components/inventory/KardexTable";
import { StockSearch } from "@/components/inventory/StockSearch";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Truck, AlertTriangle, Eye, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Badge } from "@/components/ui/badge";

interface InventoryData {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  transitStock: number;
  items: any[];
  movements: any[];
  kardex: any[];
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const isSalesRole = session?.user?.role === "SALES";
  const isWarehouseRole = session?.user?.role === "WAREHOUSE";
  const isAdminRole = session?.user?.role === "ADMIN";
  const isSupervisorRole = session?.user?.role === "SUPERVISOR";
  
  const canModifyInventory = isAdminRole || isSupervisorRole || isWarehouseRole;
  const canOnlyView = isSalesRole;

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cargar datos de inventario con useEffect + fetch
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = selectedProduct 
          ? `/api/inventory?productId=${selectedProduct}`
          : "/api/inventory";
        
        const response = await fetch(url, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Error al cargar inventario");
        }
        
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar inventario");
        console.error("Error fetching inventory:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [selectedProduct]);

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WAREHOUSE", "SALES"]}>
      <div className="p-6 space-y-6">
        {/* Header - Título y acciones del inventario */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventario</h1>
            <p className="text-muted-foreground">
              {canOnlyView 
                ? "Visualización de inventario (solo consulta)" 
                : "Gestión completa de inventario"
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canOnlyView && (
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                <Eye className="h-4 w-4 mr-2" />
                Solo Consulta
              </Badge>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {canModifyInventory ? (
                <InventoryMovementForm onSuccess={() => window.location.reload()} />
              ) : (
                <Button disabled className="opacity-50 cursor-not-allowed">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Aviso para rol SALES */}
        {canOnlyView && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Modo Solo Consulta
              </p>
              <p className="text-sm text-yellow-700">
                Tu rol de <strong>VENTAS</strong> solo permite visualizar el inventario. 
                No puedes realizar movimientos ni modificaciones.
              </p>
            </div>
          </div>
        )}

        {/* Aviso para WAREHOUSE */}
        {isWarehouseRole && !canOnlyView && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Gestión de Inventario
              </p>
              <p className="text-sm text-blue-700">
                Puedes gestionar movimientos de inventario, transferencias y ajustes.
              </p>
            </div>
          </div>
        )}

        {/* Buscador de Disponibilidad */}
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Consultar Disponibilidad</h2>
            <Badge variant="outline" className="ml-auto">
              <Eye className="h-3 w-3 mr-1" />
              {canOnlyView ? "Solo consulta" : "Consulta rápida"}
            </Badge>
          </div>
          <StockSearch />
        </div>

        {/* Tarjetas de Resumen */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : (
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
        )}

        {/* Tabs de inventario */}
        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="kardex">Kardex</TabsTrigger>
            <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
            {canModifyInventory && (
              <TabsTrigger value="cycles">Conteos</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="movements">
            <InventoryMovement movements={inventory?.movements || []} />
          </TabsContent>
          <TabsContent value="kardex">
            <KardexTable data={inventory?.kardex || []} />
          </TabsContent>
          <TabsContent value="locations">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">Gestión de ubicaciones en desarrollo...</p>
            </div>
          </TabsContent>
          {canModifyInventory && (
            <TabsContent value="cycles">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">Conteos cíclicos en desarrollo...</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}