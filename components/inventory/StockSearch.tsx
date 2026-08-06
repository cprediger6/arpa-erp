// components/inventory/StockSearch.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Package, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";

interface StockResult {
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
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    warehouse: {
      id: string;
      name: string;
    };
  }[];
  category: {
    name: string;
  } | null;
}

export function StockSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Por favor, ingresa un término de búsqueda");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        search: searchTerm.trim(),
        includeStock: "true",
      });

      const response = await fetch(`/api/products/stock-search?${params}`);
      
      if (!response.ok) {
        throw new Error("Error al buscar productos");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar al presionar Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getStockStatus = (available: number) => {
    if (available > 10) return { label: "Disponible", color: "bg-green-500", icon: CheckCircle };
    if (available > 0) return { label: "Stock Bajo", color: "bg-yellow-500", icon: AlertCircle };
    return { label: "Sin Stock", color: "bg-red-500", icon: XCircle };
  };

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU, código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Busca por nombre, SKU, código de barras o modelo
          </p>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="ml-3 text-muted-foreground">Buscando productos...</p>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearched && !isLoading && results.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground">
              Intenta con otro término de búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && !isLoading && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se encontraron {results.length} producto{results.length > 1 ? "s" : ""}
          </p>

          {results.map((product) => {
            const totalStock = product.inventory.reduce((sum, inv) => sum + inv.availableStock, 0);
            const status = getStockStatus(totalStock);
            const StatusIcon = status.icon;

            return (
              <Card key={product.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-start gap-4">
                    {product.images && product.images.length > 0 ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">SKU: {product.sku}</Badge>
                        {product.barcode && (
                          <Badge variant="outline">Código: {product.barcode}</Badge>
                        )}
                        {product.category && (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${status.color} text-white px-3 py-1`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Stock Total</p>
                      <p className="text-2xl font-bold">{totalStock}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Disponible</p>
                      <p className="text-2xl font-bold text-green-600">
                        {product.inventory.reduce((sum, inv) => sum + inv.availableStock, 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Reservado</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {product.inventory.reduce((sum, inv) => sum + inv.reservedStock, 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Ubicaciones</p>
                      <p className="text-2xl font-bold">
                        {product.inventory.length}
                      </p>
                    </div>
                  </div>

                  {/* Detalle por almacén */}
                  {product.inventory.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Disponibilidad por Almacén</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Almacén</TableHead>
                            <TableHead className="text-right">Disponible</TableHead>
                            <TableHead className="text-right">Reservado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.inventory.map((inv, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{inv.warehouse.name}</TableCell>
                              <TableCell className="text-right text-green-600">
                                {inv.availableStock}
                              </TableCell>
                              <TableCell className="text-right text-yellow-600">
                                {inv.reservedStock}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {inv.currentStock}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Variantes */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Variantes</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => (
                          <Badge key={variant.id} variant="outline" className="px-3 py-1">
                            {variant.name}: {variant.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}