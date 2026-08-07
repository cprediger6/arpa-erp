// components/inventory/ProductSearch.tsx (versión sin debounce)
"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  variants: { id: string; name: string; value: string; price: number }[];
  inventory: { availableStock: number; currentStock: number }[];
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export function ProductSearch({ 
  onSelect, 
  placeholder = "Buscar producto...", 
  excludeIds = [] 
}: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (value: string) => {
    setSearch(value);

    if (value.length < 2) {
      setProducts([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        search: value.trim(),
        limit: "50",
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Error al buscar productos");
      const data = await res.json();
      const filtered = data.filter((p: Product) => !excludeIds.includes(p.id));
      setProducts(filtered);
      setIsOpen(filtered.length > 0);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || products.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % products.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + products.length) % products.length);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < products.length) {
          handleSelect(products[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearch("");
    setProducts([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && products.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-72 overflow-y-auto">
          <div className="py-1">
            {products.map((product, index) => {
              const stock = product.inventory?.[0]?.availableStock || 0;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isSelected ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {product.images && product.images.length > 0 ? (
                      <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {product.variants.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {product.variants.length} vars
                      </Badge>
                    )}
                    <Badge variant={stock > 0 ? "default" : "destructive"} className="text-xs">
                      Stock: {stock}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}