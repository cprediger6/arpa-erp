// types/product.ts
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  isActive: boolean;
  category?: { name: string; id?: string } | null;
  variants: Array<{ 
    id?: string;
    name: string; 
    value: string; 
    price: number; 
    cost?: number;
    stock?: number;
  }>;
  inventory: Array<{ 
    currentStock: number;
    availableStock: number;
    reservedStock?: number;
    warehouse: {
      id: string;
      name: string;
    };
  }>;
  images?: string[];
  description?: string | null;
  internalCode?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}