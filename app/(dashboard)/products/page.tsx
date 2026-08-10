// app/(dashboard)/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProductList } from "@/components/products/ProductList";
import { ROLES } from "@/lib/auth/roles";
import { Product } from "@/types/product"; // ✅ Importar el tipo compartido

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const canModifyProducts = session?.user?.role === "ADMIN" || 
                           session?.user?.role === "SUPERVISOR" || 
                           session?.user?.role === "WAREHOUSE";

  const isSalesRole = session?.user?.role === "SALES";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);
        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) {
          throw new Error("Error al cargar productos");
        }
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar productos");
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch]);

  const handleDelete = async (productId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400 && data.stock) {
          alert(`No se puede eliminar el producto porque tiene ${data.stock} unidades en stock.`);
        } else if (res.status === 400 && data.sales) {
          alert(`No se puede eliminar el producto porque tiene ${data.sales} ventas asociadas.`);
        } else {
          throw new Error(data.error || "Error al eliminar producto");
        }
        return;
      }
      
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error al eliminar el producto");
    }
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE, ROLES.SALES]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
            <p className="text-muted-foreground">
              Gestiona todos los productos de tu empresa
            </p>
          </div>
          <div className="flex gap-2">
            {canModifyProducts && (
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </Link>
            )}
            {isSalesRole && (
              <Badge variant="outline" className="px-4 py-2">
                Solo consulta
              </Badge>
            )}
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  size="sm"
                >
                  Grid
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "outline"}
                  onClick={() => setViewMode("table")}
                  size="sm"
                >
                  Tabla
                </Button>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de productos */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        ) : (
          <ProductList 
            products={products} 
            viewMode={viewMode}
            onDelete={handleDelete}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}