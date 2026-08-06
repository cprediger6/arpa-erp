// app/(dashboard)/products/page.tsx (con useRouter)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ Usar useRouter
import { useSession } from "next-auth/react";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProductList } from "@/components/products/ProductList";
import { ProductListSkeleton } from "@/components/products/ProductListSkeleton";

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

export default function ProductsPage() {
  const router = useRouter(); // ✅ Router para navegación
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
        setProducts(data);
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
      
      if (!res.ok) {
        throw new Error("Error al eliminar producto");
      }
      
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error al eliminar el producto");
    }
  };

  const handleNewProduct = () => {
    router.push("/products/new");
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WAREHOUSE", "SALES"]}>
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
              <Button onClick={handleNewProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
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
          <ProductListSkeleton count={6} />
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