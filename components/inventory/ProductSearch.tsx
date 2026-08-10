// components/inventory/ProductSearch.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Definir el tipo Product que coincide con la respuesta del endpoint
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

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  excludeProductId?: string;
}

export function ProductSearch({ 
  onSelect, 
  placeholder = "Buscar producto...", 
  className,
  excludeProductId 
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchProducts = async () => {
      setIsLoading(true);
      try {
        // Usar el endpoint existente stock-search con includeStock=true
        const response = await fetch(
          `/api/products/stock-search?search=${encodeURIComponent(searchTerm)}&includeStock=true`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Error al buscar productos");
        }

        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Error al buscar productos:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setIsOpen(false);
    onSelect(product);
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    setResults([]);
    setIsOpen(false);
  };

  // Calcular stock total de un producto
  const getTotalStock = (product: Product) => {
    return product.inventory?.reduce(
      (sum, inv) => sum + (inv.availableStock || 0), 
      0
    ) || 0;
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.length >= 2) {
              setIsOpen(true);
            }
          }}
          className="pl-10 pr-10"
        />
        {selectedProduct && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={clearSelection}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
          {results.map((product) => {
            const totalStock = getTotalStock(product);
            // Convertir a boolean explícitamente
            const isExcluded = Boolean(excludeProductId && product.id === excludeProductId);

            return (
              <button
                key={product.id}
                type="button"
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors flex items-start gap-3",
                  isExcluded && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isExcluded && handleSelectProduct(product)}
                disabled={isExcluded}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>SKU: {product.sku}</span>
                    <span>•</span>
                    <span>Stock: {totalStock}</span>
                    {product.variants && product.variants.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{product.variants.length} variantes</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {totalStock} unidades
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && searchTerm.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No se encontraron productos</p>
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </div>
      )}
    </div>
  );
}