// components/inventory/InventoryMovementForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductSearch } from "./ProductSearch";

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  variants: { id: string; name: string; value: string; price: number }[];
  inventory: { availableStock: number; currentStock: number }[];
}

interface Warehouse {
  id: string;
  name: string;
  type: string;
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
          fetch("/api/products?limit=100", {
            credentials: "include",
          }),
          fetch("/api/warehouses", {
            credentials: "include",
          }),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (warehousesRes.ok) {
          const warehousesData = await warehousesRes.json();
          setWarehouses(warehousesData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const movementData = {
        ...formData,
        quantity: Number(formData.quantity),
        unitCost: Number(formData.unitCost),
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
        // Resetear formulario
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
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error:", error);
      setError(error.message || "Error al crear movimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ENTRY: "Entrada",
      EXIT: "Salida",
      TRANSFER: "Transferencia",
      ADJUSTMENT: "Ajuste",
      PRODUCTION: "Producción",
      RETURN: "Devolución",
      WASTE: "Merma",
      INTERNAL: "Consumo Interno",
      LOAN: "Préstamo",
      DONATION: "Donación",
    };
    return labels[type] || type;
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
            {/* Tipo de movimiento */}
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
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="PRODUCTION">Producción</SelectItem>
                  <SelectItem value="RETURN">Devolución</SelectItem>
                  <SelectItem value="WASTE">Merma</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                    Stock: {selectedProduct.inventory?.[0]?.availableStock || 0}
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

            {/* Almacén */}
            <div>
              <Label htmlFor="warehouseId">Almacén *</Label>
              <Select
                value={formData.warehouseId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén" />
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

            {/* Transferencia: almacenes origen y destino */}
            {formData.type === "TRANSFER" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceWarehouseId">Almacén Origen *</Label>
                  <Select
                    value={formData.sourceWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sourceWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetWarehouseId">Almacén Destino *</Label>
                  <Select
                    value={formData.targetWarehouseId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetWarehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
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