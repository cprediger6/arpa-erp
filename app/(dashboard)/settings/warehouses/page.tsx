// app/(dashboard)/settings/warehouses/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Warehouse, MapPin, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { WarehouseForm } from "@/components/Settings/WarehouseForm";
import { LocationsList } from "@/components/Settings/LocationsList";

interface Location {
  id: string;
  aisle: string;
  shelf: string;
  level: string;
  position: string;
  barcode: string | null;
  _count: {
    inventory: number;
  };
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  locations: Location[];
  _count: {
    inventory: number;
  };
}

export default function WarehousesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);

  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      console.log("📦 Fetching warehouses for company:", session?.user?.companyId);
      
      const response = await fetch("/api/settings/warehouses");
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cargar depósitos");
      }
      
      const data = await response.json();
      console.log("✅ Warehouses encontrados:", data.length);
      setWarehouses(data);
    } catch (error: any) {
      console.error("❌ Error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los depósitos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchWarehouses();
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este depósito?")) return;

    try {
      const response = await fetch(`/api/settings/warehouses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Depósito eliminado correctamente",
      });
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el depósito",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/settings/warehouses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar");
      }

      toast({
        title: "Éxito",
        description: `Depósito ${!currentStatus ? "activado" : "desactivado"} correctamente`,
      });
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary" }> = {
      CENTRAL: { label: "Central", variant: "default" },
      SECONDARY: { label: "Secundario", variant: "secondary" },
      STORE: { label: "Tienda", variant: "success" },
      VIRTUAL: { label: "Virtual", variant: "warning" },
    };
    return types[type] || { label: type, variant: "secondary" };
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-muted-foreground">Cargando depósitos...</span>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Depósitos</h1>
            <p className="text-muted-foreground">
              Gestiona los depósitos y ubicaciones de tu empresa
            </p>
          </div>
          <Button onClick={() => { setSelectedWarehouse(null); setShowWarehouseForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Depósito
          </Button>
        </div>

        {warehouses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Warehouse className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">No hay depósitos configurados</p>
              <p className="text-sm text-gray-400">Crea tu primer depósito para comenzar</p>
              <Button 
                className="mt-4"
                onClick={() => { setSelectedWarehouse(null); setShowWarehouseForm(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Depósito
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {warehouses.map((warehouse) => (
              <Card key={warehouse.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Warehouse className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getTypeBadge(warehouse.type).variant}>
                          {getTypeBadge(warehouse.type).label}
                        </Badge>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                          {warehouse.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {warehouse._count.inventory} productos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(warehouse.id, warehouse.isActive)}
                    >
                      {warehouse.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedWarehouse(warehouse); setShowWarehouseForm(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(warehouse.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList>
                      <TabsTrigger value="details">Detalles</TabsTrigger>
                      <TabsTrigger value="locations">
                        <MapPin className="h-4 w-4 mr-2" />
                        Ubicaciones ({warehouse.locations.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {warehouse.address && (
                          <div>
                            <p className="text-sm text-muted-foreground">Dirección</p>
                            <p className="font-medium">{warehouse.address}</p>
                          </div>
                        )}
                        {warehouse.phone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Teléfono</p>
                            <p className="font-medium">{warehouse.phone}</p>
                          </div>
                        )}
                        {warehouse.email && (
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{warehouse.email}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="locations" className="mt-4">
                      <LocationsList 
                        warehouseId={warehouse.id}
                        locations={warehouse.locations}
                        onUpdate={fetchWarehouses}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showWarehouseForm && (
          <WarehouseForm
            warehouse={selectedWarehouse || undefined}
            onClose={() => {
              setShowWarehouseForm(false);
              setSelectedWarehouse(null);
            }}
            onSuccess={() => {
              setShowWarehouseForm(false);
              setSelectedWarehouse(null);
              fetchWarehouses();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}