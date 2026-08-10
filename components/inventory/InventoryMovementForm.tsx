// components/inventory/InventoryMovementForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductSearch } from "./ProductSearch";

// Este tipo debe coincidir con el que devuelve ProductSearch
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  images: string[];
  variants: { 
    id: string; 
    name: string; 
    value: string; 
    price: number;
  }[];
  inventory: { 
    availableStock: number; 
    currentStock: number; 
    reservedStock: number;
    warehouse: {
      id: string;
      name: string;
    };
  }[];
  category: {
    id: string;
    name: string;
  } | null;
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface InventoryMovementFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function InventoryMovementForm({ onSuccess, onClose }: InventoryMovementFormProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkbox para movimiento entre depósitos
  const [isTransferBetweenWarehouses, setIsTransferBetweenWarehouses] = useState(false);

  const [formData, setFormData] = useState({
    type: "ENTRY",
    productId: "",
    variantId: "",
    warehouseId: "",
    quantity: 1,
    unitCost: 0,
    reference: "",
    description: "",
    sourceWarehouseId: "",
    targetWarehouseId: "",
  });

  // Cargar productos y almacenes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          fetch("/api/products/stock-search?includeStock=true&limit=100", {
            credentials: "include",
          }),
          fetch("/api/settings/warehouses", {
            credentials: "include",
          }),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (warehousesRes.ok) {
          const warehousesData = await warehousesRes.json();
          setWarehouses(warehousesData.filter((w: Warehouse) => w.isActive));
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setIsTransferBetweenWarehouses(false);
      setFormData({
        type: "ENTRY",
        productId: "",
        variantId: "",
        warehouseId: "",
        quantity: 1,
        unitCost: 0,
        reference: "",
        description: "",
        sourceWarehouseId: "",
        targetWarehouseId: "",
      });
      setSelectedProduct(null);
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      // Validaciones
      if (!formData.productId) {
        throw new Error("Debes seleccionar un producto");
      }

      // Si es transferencia entre depósitos
      if (isTransferBetweenWarehouses) {
        if (!formData.sourceWarehouseId) {
          throw new Error("Debes seleccionar el depósito origen");
        }
        if (!formData.targetWarehouseId) {
          throw new Error("Debes seleccionar el depósito destino");
        }
        if (formData.sourceWarehouseId === formData.targetWarehouseId) {
          throw new Error("El depósito origen y destino no pueden ser el mismo");
        }
        
        // Verificar stock en origen
        const product = products.find(p => p.id === formData.productId);
        const stockInSource = product?.inventory?.find(
          i => i.warehouse.id === formData.sourceWarehouseId
        )?.availableStock || 0;
        
        if (stockInSource < formData.quantity) {
          throw new Error(`Stock insuficiente en origen. Disponible: ${stockInSource}`);
        }
      }

      const movementData = {
        ...formData,
        quantity: Number(formData.quantity),
        unitCost: Number(formData.unitCost),
        isTransfer: isTransferBetweenWarehouses,
      };

      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(movementData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear movimiento");
      }

      setSuccess("Movimiento creado exitosamente");
      setTimeout(() => {
        setIsOpen(false);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error:", error);
      setError(error.message || "Error al crear movimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtener depósitos disponibles para origen (excluyendo el destino seleccionado)
  const getAvailableSourceWarehouses = () => {
    return warehouses.filter(w => w.id !== formData.targetWarehouseId);
  };

  // Obtener depósitos disponibles para destino (excluyendo el origen seleccionado)
  const getAvailableTargetWarehouses = () => {
    return warehouses.filter(w => w.id !== formData.sourceWarehouseId);
  };

  // Verificar stock en el depósito origen para el producto seleccionado
  const getStockInWarehouse = (warehouseId: string) => {
    if (!selectedProduct) return 0;
    const item = selectedProduct.inventory?.find(i => i.warehouse.id === warehouseId);
    return item?.availableStock || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Checkbox: Movimiento entre depósitos */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="transferBetweenWarehouses"
                checked={isTransferBetweenWarehouses}
                onCheckedChange={(checked) => {
                  setIsTransferBetweenWarehouses(checked as boolean);
                  if (checked) {
                    setFormData(prev => ({ ...prev, type: "TRANSFER" }));
                  } else {
                    setFormData(prev => ({ ...prev, type: "ENTRY" }));
                  }
                }}
              />
              <Label htmlFor="transferBetweenWarehouses" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                Movimiento entre depósitos
              </Label>
            </div>

            {/* Tipo de movimiento (oculto si es transferencia) */}
            {!isTransferBetweenWarehouses && (
              <div>
                <Label htmlFor="type">Tipo de Movimiento *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">Entrada</SelectItem>
                    <SelectItem value="EXIT">Salida</SelectItem>
                    <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                    <SelectItem value="PRODUCTION">Producción</SelectItem>
                    <SelectItem value="RETURN">Devolución</SelectItem>
                    <SelectItem value="WASTE">Merma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isTransferBetweenWarehouses && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">📦 Transferencia entre depósitos</p>
                <p className="text-xs text-yellow-700 mt-1">
                  El stock se restará del depósito origen y se sumará al depósito destino.
                </p>
              </div>
            )}

            {/* Producto */}
            <div>
              <Label>Producto *</Label>
              <ProductSearch
                onSelect={(product) => {
                  setSelectedProduct(product);
                  setFormData(prev => ({ 
                    ...prev, 
                    productId: product.id, 
                    variantId: "" 
                  }));
                }}
                placeholder="Buscar producto por nombre o SKU..."
              />
              {selectedProduct && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                  </div>
                  <Badge variant="outline">
                    Stock total: {selectedProduct.inventory?.reduce((sum, i) => sum + i.availableStock, 0) || 0}
                  </Badge>
                </div>
              )}
            </div>

            {/* Variante (si aplica) */}
            {selectedProduct && selectedProduct.variants.length > 0 && (
              <div>
                <Label htmlFor="variantId">Variante</Label>
                <Select
                  value={formData.variantId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, variantId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}: {variant.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Depósitos para transferencia */}
            {isTransferBetweenWarehouses ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceWarehouseId">Depósito Origen *</Label>
                  <Select
                    value={formData.sourceWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sourceWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSourceWarehouses().map((warehouse) => {
                        const stock = getStockInWarehouse(warehouse.id);
                        const hasStock = stock > 0;
                        return (
                          <SelectItem 
                            key={warehouse.id} 
                            value={warehouse.id}
                            disabled={!hasStock}
                          >
                            {warehouse.name} ({warehouse.type})
                            {selectedProduct && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                Stock: {stock}
                              </span>
                            )}
                            {!hasStock && selectedProduct && (
                              <span className="ml-2 text-xs text-red-500">
                                (Sin stock)
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedProduct && formData.sourceWarehouseId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Stock disponible: {getStockInWarehouse(formData.sourceWarehouseId)}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="targetWarehouseId">Depósito Destino *</Label>
                  <Select
                    value={formData.targetWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTargetWarehouses().map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              /* Depósito único para otros movimientos */
              <div>
                <Label htmlFor="warehouseId">Depósito *</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cantidad y costo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 1;
                    setFormData(prev => ({ ...prev, quantity: value }));
                    // Validar stock si es transferencia
                    if (isTransferBetweenWarehouses && formData.sourceWarehouseId) {
                      const stock = getStockInWarehouse(formData.sourceWarehouseId);
                      if (value > stock) {
                        setError(`Stock insuficiente. Disponible: ${stock}`);
                      } else {
                        setError("");
                      }
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitCost">Costo Unitario</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Referencia y descripción */}
            <div>
              <Label htmlFor="reference">Referencia</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Ej: OC-001, VEN-001"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalle del movimiento"
              />
            </div>

            {/* Mensajes */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Crear Movimiento"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}