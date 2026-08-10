// app/(dashboard)/inventory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { InventoryMovement } from "@/components/inventory/InventoryMovement";
import { KardexTable } from "@/components/inventory/KardexTable";
import { StockSearch } from "@/components/inventory/StockSearch";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";
import { InventoryByWarehouse } from "@/components/inventory/InventoryByWarehouse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Truck, AlertTriangle, Eye, Search, Warehouse, Loader2 } from "lucide-react";
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
  byWarehouse: {
    warehouseId: string;
    warehouseName: string;
    warehouseType?: string;
    totalStock: number;
    items: any[];
  }[];
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

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WAREHOUSE", "SALES"]}>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-muted-foreground">Cargando inventario...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WAREHOUSE", "SALES"]}>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">Inventario</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {canOnlyView 
                ? "Visualización de inventario (solo consulta)" 
                : "Gestión completa de inventario"
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {canOnlyView && (
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Solo Consulta
              </Badge>
            )}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                disabled={isLoading}
                className="flex-1 sm:flex-none text-sm"
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">Actualizar</span>
                <span className="xs:hidden">Actualizar</span>
              </Button>
              {canModifyInventory ? (
                <InventoryMovementForm onSuccess={() => window.location.reload()} />
              ) : (
                <Button disabled className="opacity-50 cursor-not-allowed flex-1 sm:flex-none text-sm" size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Nuevo Movimiento</span>
                  <span className="xs:hidden">Nuevo</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Avisos */}
        {canOnlyView && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-yellow-800">Modo Solo Consulta</p>
              <p className="text-xs sm:text-sm text-yellow-700 break-words">
                Tu rol de <strong>VENTAS</strong> solo permite visualizar el inventario.
              </p>
            </div>
          </div>
        )}

        {isWarehouseRole && !canOnlyView && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-800">Gestión de Inventario</p>
              <p className="text-xs sm:text-sm text-blue-700 break-words">
                Puedes gestionar movimientos de inventario, transferencias y ajustes.
              </p>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="border rounded-lg p-3 sm:p-4 bg-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold">Consultar Disponibilidad</h2>
            <Badge variant="outline" className="ml-auto text-xs">
              <Eye className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
              {canOnlyView ? "Solo consulta" : "Consulta rápida"}
            </Badge>
          </div>
          <StockSearch />
        </div>

        {/* Tarjetas de Resumen */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-sm sm:text-base">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <InventoryCard
              title="Stock Total"
              value={inventory?.totalStock || 0}
              icon={<Truck className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
            <InventoryCard
              title="Stock Disponible"
              value={inventory?.availableStock || 0}
              icon={<RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
            <InventoryCard
              title="Stock Reservado"
              value={inventory?.reservedStock || 0}
              icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
            <InventoryCard
              title="Stock en Tránsito"
              value={inventory?.transitStock || 0}
              icon={<Truck className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="warehouses" className="w-full">
          <TabsList className="flex flex-wrap w-full sm:w-auto overflow-x-auto no-scrollbar">
            <TabsTrigger value="warehouses" className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap">
              <Warehouse className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Por Depósito</span>
              <span className="xs:hidden">Depósitos</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap">
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="kardex" className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap">
              Kardex
            </TabsTrigger>
            {canModifyInventory && (
              <TabsTrigger value="cycles" className="flex-1 sm:flex-none text-xs sm:text-sm whitespace-nowrap">
                Conteos
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="warehouses" className="mt-4">
            <InventoryByWarehouse 
              data={inventory?.byWarehouse || []} 
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="movements" className="mt-4">
            <div className="overflow-x-auto">
              <InventoryMovement movements={inventory?.movements || []} />
            </div>
          </TabsContent>
          <TabsContent value="kardex" className="mt-4">
            <div className="overflow-x-auto">
              <KardexTable data={inventory?.kardex || []} />
            </div>
          </TabsContent>
          {canModifyInventory && (
            <TabsContent value="cycles" className="mt-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Conteos cíclicos en desarrollo...</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Estilos adicionales para el scrollbar */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
          .xs\\:hidden {
            display: none;
          }
        }
        @media (min-width: 481px) {
          .xs\\:inline {
            display: none;
          }
          .xs\\:hidden {
            display: inline;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}