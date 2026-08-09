// components/inventory/InventoryByWarehouse.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Package, MapPin, Building2, Loader2 } from "lucide-react";

interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  warehouseType?: string;
  totalStock: number;
  items: {
    productId: string;
    productName: string;
    sku?: string;
    variantName?: string;
    variantId?: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    transitStock: number;
    location?: {
      aisle: string;
      shelf: string;
      level: string;
      position: string;
    };
  }[];
}

interface InventoryByWarehouseProps {
  data: WarehouseInventory[];
  isLoading?: boolean;
}

export function InventoryByWarehouse({ data, isLoading = false }: InventoryByWarehouseProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-muted-foreground">Cargando inventario por depósito...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Warehouse className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600">No hay inventario disponible</p>
          <p className="text-sm text-gray-400">No se encontraron artículos en ningún depósito</p>
        </CardContent>
      </Card>
    );
  }

  const totalItems = data.reduce((acc, warehouse) => acc + warehouse.items.length, 0);

  // Colores para tipos de depósito
  const getWarehouseTypeColor = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'CENTRAL':
        return 'bg-purple-100 text-purple-800';
      case 'SECONDARY':
        return 'bg-blue-100 text-blue-800';
      case 'STORE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inventario por Depósito</h3>
          <p className="text-sm text-muted-foreground">
            {data.length} depósito{data.length > 1 ? 's' : ''} · {totalItems} artículo{totalItems > 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {data.length} Depósitos
        </Badge>
      </div>

      {data.map((warehouse) => (
        <Card key={warehouse.warehouseId} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Warehouse className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {warehouse.warehouseName}
                    {warehouse.warehouseType && (
                      <Badge className={getWarehouseTypeColor(warehouse.warehouseType)}>
                        {warehouse.warehouseType}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {warehouse.items.length} productos · Stock total: {warehouse.totalStock}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-white">
                Stock: {warehouse.totalStock}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {warehouse.items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No hay productos en este depósito</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead className="text-right">Stock Total</TableHead>
                      <TableHead className="text-right">Disponible</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">En Tránsito</TableHead>
                      <TableHead>Ubicación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouse.items.map((item) => (
                      <TableRow key={`${item.productId}-${warehouse.warehouseId}`}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.sku || '-'}</TableCell>
                        <TableCell>{item.variantName || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.currentStock}</TableCell>
                        <TableCell className="text-right text-green-600">{item.availableStock}</TableCell>
                        <TableCell className="text-right text-yellow-600">{item.reservedStock}</TableCell>
                        <TableCell className="text-right text-blue-600">{item.transitStock}</TableCell>
                        <TableCell>
                          {item.location ? (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-muted-foreground">
                                {item.location.aisle} - {item.location.shelf} - {item.location.level}
                                {item.location.position && ` - ${item.location.position}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin ubicación</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}