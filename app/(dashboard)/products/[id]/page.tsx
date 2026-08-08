// app/(dashboard)/products/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  DollarSign, 
  Warehouse, 
  Barcode,
  Tag,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import Image from "next/image";

interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  internalCode: string;
  barcode: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  weight: number | null;
  unitOfMeasure: string;
  hasIva: boolean;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: { name: string } | null;
  subcategory: { name: string } | null;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    price: number;
    cost: number;
    sku: string | null;
    stock: number;
  }>;
  inventory: Array<{
    id: string;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    warehouse: {
      id: string;
      name: string;
    };
  }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = params.id as string;

  const canModifyProducts = session?.user?.role === "ADMIN" || 
                           session?.user?.role === "SUPERVISOR" || 
                           session?.user?.role === "WAREHOUSE";

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Producto no encontrado");
          }
          throw new Error("Error al cargar el producto");
        }
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el producto");
        console.error("Error fetching product:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Calcular totales de inventario
  const totalStock = product?.inventory?.reduce((sum, item) => sum + item.currentStock, 0) || 0;
  const totalAvailable = product?.inventory?.reduce((sum, item) => sum + item.availableStock, 0) || 0;
  const totalReserved = product?.inventory?.reduce((sum, item) => sum + item.reservedStock, 0) || 0;

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE, ROLES.SALES]}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-muted-foreground">Cargando producto...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE, ROLES.SALES]}>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Error al cargar el producto</h2>
          <p className="mt-2 text-muted-foreground">{error || "Producto no encontrado"}</p>
          <Button className="mt-4" onClick={() => router.push("/products")}>
            Volver al catálogo
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE, ROLES.SALES]}>
      <div className="space-y-6">
        {/* Header con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/products")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">
                SKU: {product.sku} • {product.internalCode}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canModifyProducts && (
              <Link href={`/products/${product.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            )}
            <Badge variant={product.isActive ? "success" : "secondary"} className="px-4 py-2">
              {product.isActive ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              {product.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imagen del producto */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
              {product.images && product.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {product.images.slice(1).map((image, index) => (
                    <div key={index} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border">
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información general */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-lg font-semibold">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="text-lg font-semibold">{product.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código Interno</label>
                  <p className="text-lg font-semibold">{product.internalCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código de Barras</label>
                  <p className="text-lg font-semibold">{product.barcode || "No registrado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marca</label>
                  <p className="text-lg font-semibold">{product.brand || "No registrada"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                  <p className="text-lg font-semibold">{product.model || "No registrado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                  <p className="text-lg font-semibold">{product.category?.name || "Sin categoría"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subcategoría</label>
                  <p className="text-lg font-semibold">{product.subcategory?.name || "Sin subcategoría"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unidad de Medida</label>
                  <p className="text-lg font-semibold">{product.unitOfMeasure}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Peso</label>
                  <p className="text-lg font-semibold">{product.weight ? `${product.weight} kg` : "No registrado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tiene IVA</label>
                  <p className="text-lg font-semibold">{product.hasIva ? "Sí" : "No"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                  <p className="text-lg font-semibold">
                    {new Date(product.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {product.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="mt-1 text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Stock Total</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Stock Disponible</p>
                <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Stock Reservado</p>
                <p className="text-2xl font-bold text-yellow-600">{totalReserved}</p>
              </div>
            </div>

            {product.inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Almacén</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Disponible</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Reservado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.warehouse.name}</td>
                        <td className="px-4 py-3 text-right">{item.currentStock}</td>
                        <td className="px-4 py-3 text-right text-green-600">{item.availableStock}</td>
                        <td className="px-4 py-3 text-right text-yellow-600">{item.reservedStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay inventario registrado para este producto
              </p>
            )}
          </CardContent>
        </Card>

        {/* Variantes */}
        {product.variants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Variantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{variant.name}</td>
                        <td className="px-4 py-3">{variant.value}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          ${variant.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">${variant.cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={variant.stock > 10 ? "default" : "destructive"}>
                            {variant.stock}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                          {variant.sku || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}