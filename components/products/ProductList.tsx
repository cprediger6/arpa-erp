// components/products/ProductList.tsx (alternativa sin Link)
"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Package, DollarSign, Warehouse } from "lucide-react";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  isActive: boolean;
  category?: { name: string } | null;
  variants: Array<{ price: number; cost: number; stock: number }>;
  inventory: Array<{ currentStock: number }>;
  images?: string[];
  description?: string;
}

interface ProductListProps {
  products: Product[];
  onDelete?: (productId: string) => void;
  viewMode?: "grid" | "table";
}

export function ProductList({ 
  products, 
  onDelete, 
  viewMode = "grid" 
}: ProductListProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const canModifyProducts = session?.user?.role === "ADMIN" || 
                           session?.user?.role === "SUPERVISOR" || 
                           session?.user?.role === "WAREHOUSE";
  
  const isAdmin = session?.user?.role === "ADMIN";

  const handleView = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleEdit = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  if (viewMode === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {product.images && product.images.length > 0 && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{product.sku}</td>
                <td className="px-4 py-3 text-sm">{product.category?.name || "-"}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  ${product.variants?.[0]?.price?.toFixed(2) || "0.00"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={product.inventory?.[0]?.currentStock > 10 ? "default" : "destructive"}>
                    <Warehouse className="h-3 w-3 mr-1" />
                    {product.inventory?.[0]?.currentStock || 0}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={product.isActive ? "success" : "secondary"}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(product.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canModifyProducts && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(product.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => onDelete?.(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Vista Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {product.images && product.images.length > 0 && (
            <div className="relative h-48 bg-gray-100">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={product.isActive ? "success" : "secondary"}>
                  {product.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                {product.category && (
                  <p className="text-xs text-gray-400 mt-1">
                    {product.category.name}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4 text-gray-400" />
                <Badge variant={product.inventory?.[0]?.currentStock > 10 ? "default" : "destructive"} className="text-xs">
                  {product.inventory?.[0]?.currentStock || 0}
                </Badge>
              </span>
              <span className="flex items-center gap-1 font-medium text-blue-600">
                <DollarSign className="h-4 w-4" />
                ${product.variants?.[0]?.price?.toFixed(2) || "0.00"}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleView(product.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              {canModifyProducts && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEdit(product.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDelete?.(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {products.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando un nuevo producto.
          </p>
        </div>
      )}
    </div>
  );
}