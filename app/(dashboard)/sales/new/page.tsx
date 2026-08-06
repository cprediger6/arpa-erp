// app/(dashboard)/sales/new/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  Loader2, 
  User, 
  Package, 
  AlertCircle, 
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Save,
  X,
  ShoppingCart,
  Printer
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { SaleReceipt } from "@/components/sales/SaleReceipt";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ruc: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  variants: { 
    id: string; 
    name: string; 
    value: string; 
    price: number; 
    cost: number; 
    stock: number 
  }[];
  inventory: { 
    currentStock: number; 
    availableStock: number; 
    warehouse: { id: string; name: string };
    variantId: string | null;
  }[];
  category: { name: string } | null;
}

interface SaleDetail {
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string | null;
  variantName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  availableStock: number;
}

// Datos de impuestos por país
const countryTaxes: Record<string, { name: string; rate: number }> = {
  'Panama': { name: 'ITBMS', rate: 7 },
  'Mexico': { name: 'IVA', rate: 16 },
  'Colombia': { name: 'IVA', rate: 19 },
  'Argentina': { name: 'IVA', rate: 21 },
  'Chile': { name: 'IVA', rate: 19 },
  'Peru': { name: 'IGV', rate: 18 },
  'Ecuador': { name: 'IVA', rate: 12 },
  'Uruguay': { name: 'IVA', rate: 22 },
  'Paraguay': { name: 'IVA', rate: 10 },
  'Bolivia': { name: 'IVA', rate: 13 },
  'Costa Rica': { name: 'IVA', rate: 13 },
  'El Salvador': { name: 'IVA', rate: 13 },
  'Guatemala': { name: 'IVA', rate: 12 },
  'Honduras': { name: 'IVA', rate: 15 },
  'Nicaragua': { name: 'IVA', rate: 15 },
  'USA': { name: 'Sales Tax', rate: 0 },
  'Spain': { name: 'IVA', rate: 21 },
};

function NewSaleContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    clientId: "",
    saleDate: new Date().toISOString().split('T')[0],
    deliveryDate: "",
    notes: "",
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchClient, setSearchClient] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [details, setDetails] = useState<SaleDetail[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Estado de pago
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  // Estado para selector de variantes
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // Estado para el comprobante
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Estado para la configuración de impuestos
  const [taxConfig, setTaxConfig] = useState<{ name: string; rate: number; included: boolean }>({
    name: 'IVA',
    rate: 0,
    included: false,
  });

  const [companyName, setCompanyName] = useState("Mi Empresa");
  const [companyRuc, setCompanyRuc] = useState("");
  const [companyCountry, setCompanyCountry] = useState("Panama");

  // ✅ Usar useRef para controlar si ya se cargaron los datos
  const hasLoaded = useRef(false);

  // Cargar configuración de la empresa - SOLO UNA VEZ
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    const loadCompany = async () => {
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.name || "Mi Empresa");
          setCompanyRuc(data.ruc || "");
          setCompanyCountry(data.country || "Panama");
          setCompanyData(data);
          
          const tax = countryTaxes[data.country] || countryTaxes['Panama'];
          setTaxConfig({
            name: tax.name,
            rate: tax.rate,
            included: data.settings?.taxIncluded || false,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadCompany();
  }, []);

  // Cargar clientes - SOLO UNA VEZ
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("/api/clients?limit=100");
        if (!res.ok) throw new Error("Error al cargar clientes");
        const data = await res.json();
        setClients(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadClients();
  }, []);

  // Cargar productos - SOLO UNA VEZ
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/products?limit=100");
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchClient.toLowerCase()) ||
    client.ruc?.includes(searchClient) ||
    client.phone?.includes(searchClient)
  );

  // Filtrar productos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addProduct = (product: Product, selectedVariantId?: string) => {
    const variantId = selectedVariantId || product.variants?.[0]?.id;
    const variant = product.variants?.find(v => v.id === variantId);
    const finalVariantId = variantId || null;
    
    const existingIndex = details.findIndex(d => 
      d.productId === product.id && 
      d.variantId === finalVariantId
    );
    
    if (existingIndex !== -1) {
      const newDetails = [...details];
      const current = newDetails[existingIndex];
      const maxStock = current.availableStock;
      
      if (current.quantity < maxStock) {
        newDetails[existingIndex] = {
          ...current,
          quantity: current.quantity + 1,
          total: (current.quantity + 1) * current.unitPrice - current.discount,
        };
        setDetails(newDetails);
      } else {
        alert(`Stock insuficiente. Disponible: ${maxStock}`);
      }
    } else {
      const inventoryItem = product.inventory?.find(inv => {
        if (!finalVariantId) return inv.variantId === null;
        return inv.variantId === finalVariantId;
      });
      
      const stock = inventoryItem?.availableStock || 0;
      const price = variant?.price || 0;
      const variantName = variant ? `${variant.name}: ${variant.value}` : "";

      if (stock <= 0) {
        alert(`Este producto no tiene stock disponible${variantName ? ` para la variante ${variantName}` : ''}`);
        return;
      }

      setDetails([
        ...details,
        {
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0],
          variantId: finalVariantId,
          variantName: variantName,
          quantity: 1,
          unitPrice: price,
          discount: 0,
          total: price,
          availableStock: stock,
        }
      ]);
    }
    setShowProductSearch(false);
    setSearchProduct("");
    setShowVariantSelector(false);
    setSelectedProductForVariant(null);
  };

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const detail = details[index];
    const maxStock = detail.availableStock;
    
    if (quantity > maxStock) {
      alert(`Stock insuficiente. Disponible: ${maxStock}`);
      return;
    }
    
    setDetails(details.map((d, i) =>
      i === index
        ? { ...d, quantity, total: quantity * d.unitPrice - d.discount }
        : d
    ));
  };

  const updateDiscount = (index: number, discount: number) => {
    if (discount < 0) return;
    const detail = details[index];
    setDetails(details.map((d, i) =>
      i === index
        ? { ...d, discount, total: d.quantity * d.unitPrice - discount }
        : d
    ));
  };

  const calculateTotals = () => {
    const subtotal = details.reduce((sum, d) => sum + d.quantity * d.unitPrice, 0);
    const discount = details.reduce((sum, d) => sum + d.discount, 0);
    const taxableAmount = subtotal - discount;
    
    let tax = 0;
    let taxRate = taxConfig.rate;
    let taxName = taxConfig.name;
    
    if (!taxConfig.included && taxRate > 0) {
      tax = (taxableAmount * taxRate) / 100;
    }
    
    const total = taxableAmount + tax;
    
    return { subtotal, discount, tax, taxRate, taxName, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.clientId) {
      setError("Selecciona un cliente");
      setIsSubmitting(false);
      return;
    }

    if (details.length === 0) {
      setError("Agrega al menos un producto");
      setIsSubmitting(false);
      return;
    }

    // ✅ Método de pago obligatorio
    if (!paymentMethod) {
      setError("Debes seleccionar un método de pago");
      setIsSubmitting(false);
      return;
    }

    const digitalMethods = ["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"];
    if (digitalMethods.includes(paymentMethod) && !transactionCode) {
      setError("El código de transacción es requerido para pagos digitales");
      setIsSubmitting(false);
      return;
    }

    for (const detail of details) {
      if (detail.quantity > detail.availableStock) {
        setError(`Stock insuficiente para ${detail.productName}. Disponible: ${detail.availableStock}`);
        setIsSubmitting(false);
        return;
      }
    }

    const { subtotal, discount, tax, total } = calculateTotals();
    const userId = session?.user?.id || '';
    
    if (!userId) {
      setError("No se pudo identificar al usuario. Inicia sesión nuevamente.");
      setIsSubmitting(false);
      return;
    }

    const saleData = {
      clientId: formData.clientId,
      userId: userId,
      saleDate: formData.saleDate,
      deliveryDate: formData.deliveryDate || undefined,
      notes: formData.notes,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: paymentMethod,
      transactionCode: digitalMethods.includes(paymentMethod) ? transactionCode : undefined,
      paymentReference: paymentReference || undefined,
      details: details.map(d => ({
        productId: d.productId,
        variantId: d.variantId,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        discount: d.discount,
      })),
    };

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.details || "Error al crear venta");
      }

      setCreatedSale(result.sale);
      setShowReceipt(true);
      
    } catch (error: any) {
      setError(error.message || "Error al crear la venta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, discount, tax, taxRate, taxName, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{companyName}</span>
                    {companyRuc && <span>| RUC: {companyRuc}</span>}
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {taxName} {taxRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString()}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <FileText className="h-3 w-3 mr-1" />
                NUEVO
              </Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Panel de totales */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold">${subtotal.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Descuento</p>
              <p className="text-xl font-bold text-red-500">-${discount.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-xs text-muted-foreground">
                {taxName} ({taxRate}%)
              </p>
              <p className="text-xl font-bold text-yellow-700">${tax.toFixed(2)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200 md:col-span-2">
              <p className="text-xs text-muted-foreground">Total a Pagar</p>
              <p className="text-2xl font-bold text-green-700">${total.toFixed(2)}</p>
            </div>
          </div>
          {taxConfig.included && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              ℹ️ El impuesto {taxName} ({taxRate}%) está incluido en los precios
            </p>
          )}
        </div>

        {/* Cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClient ? (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedClient.name}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {selectedClient.ruc && <span>RUC: {selectedClient.ruc}</span>}
                      {selectedClient.email && <span>Email: {selectedClient.email}</span>}
                      {selectedClient.phone && <span>Tel: {selectedClient.phone}</span>}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 md:mt-0"
                  onClick={() => {
                    setSelectedClient(null);
                    setFormData({ ...formData, clientId: "" });
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre, RUC, email o teléfono..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="pl-10"
                />
                {searchClient && filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b last:border-0"
                        onClick={() => {
                          setSelectedClient(client);
                          setFormData({ ...formData, clientId: client.id });
                          setSearchClient("");
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {client.ruc || client.email || client.phone || "Sin datos"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                Líneas de Productos
              </CardTitle>
              {!showProductSearch ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowProductSearch(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Producto
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cerrar Búsqueda
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showProductSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
                {isLoadingProducts ? (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-500 mt-1">Cargando productos...</p>
                  </div>
                ) : searchProduct && filteredProducts.length > 0 ? (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const totalStock = product.inventory?.reduce((sum, inv) => sum + inv.availableStock, 0) || 0;
                      const hasVariants = product.variants && product.variants.length > 0;
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center border-b last:border-0"
                          onClick={() => {
                            if (hasVariants && product.variants.length > 1) {
                              setSelectedProductForVariant(product);
                              setShowVariantSelector(true);
                            } else {
                              addProduct(product, product.variants?.[0]?.id || undefined);
                            }
                          }}
                          disabled={totalStock <= 0}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            {hasVariants && (
                              <span className="text-xs text-gray-400">
                                {product.variants.length} variantes
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={totalStock > 0 ? "success" : "destructive"}>
                              Stock: {totalStock}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : searchProduct && filteredProducts.length === 0 ? (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 p-4 text-center">
                    <p className="text-gray-500">No se encontraron productos</p>
                  </div>
                ) : null}
              </div>
            )}

            {showVariantSelector && selectedProductForVariant && (
              <Dialog open={showVariantSelector} onOpenChange={setShowVariantSelector}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Variante</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedProductForVariant.name}
                    </p>
                  </DialogHeader>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedProductForVariant.variants.map((variant) => {
                      const inventoryItem = selectedProductForVariant.inventory?.find(
                        inv => inv.variantId === variant.id
                      );
                      const stock = inventoryItem?.availableStock || 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className="w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 transition-colors flex justify-between items-center"
                          onClick={() => {
                            addProduct(selectedProductForVariant, variant.id);
                            setShowVariantSelector(false);
                            setSelectedProductForVariant(null);
                          }}
                          disabled={stock <= 0}
                        >
                          <div>
                            <p className="font-medium">{variant.name}: {variant.value}</p>
                            <p className="text-sm text-gray-500">Precio: ${variant.price.toFixed(2)}</p>
                          </div>
                          <Badge variant={stock > 0 ? "success" : "destructive"}>
                            Stock: {stock}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setShowVariantSelector(false)}>
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {details.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Producto</TableHead>
                      <TableHead className="text-center font-semibold">Cantidad</TableHead>
                      <TableHead className="text-right font-semibold">Precio Unit.</TableHead>
                      <TableHead className="text-right font-semibold">Descuento</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.map((detail, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{detail.productName}</p>
                            {detail.variantName && (
                              <p className="text-sm text-gray-500">{detail.variantName}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Stock: {detail.availableStock}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="1"
                            max={detail.availableStock}
                            value={detail.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20 mx-auto text-center"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${detail.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            value={detail.discount}
                            onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                            className="w-24 ml-auto text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${detail.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeDetail(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500">No hay productos agregados</p>
                <p className="text-sm text-gray-400">Haz clic en&quot;Agregar Producto&quot; para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Método de Pago e Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Método de Pago */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod" className="flex items-center gap-1">
                  Seleccionar método de pago
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">💰 Efectivo</SelectItem>
                    <SelectItem value="CREDIT_CARD">💳 Tarjeta de Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">💳 Tarjeta de Débito</SelectItem>
                    <SelectItem value="TRANSFER">🏦 Transferencia Bancaria</SelectItem>
                    <SelectItem value="DIGITAL_WALLET">📱 Billetera Digital</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Campo obligatorio. Selecciona un método de pago para continuar
                </p>
              </div>

              {["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"].includes(paymentMethod) && (
                <div>
                  <Label htmlFor="transactionCode">
                    Código de Transacción *
                    <Badge variant="outline" className="ml-2 text-xs">POSNET</Badge>
                  </Label>
                  <Input
                    id="transactionCode"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    placeholder="Ingresa el código del ticket POSNET"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El código será validado para evitar duplicados
                  </p>
                </div>
              )}

              {paymentMethod === "CASH" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  ✅ El pago en efectivo se registrará directamente.
                </div>
              )}

              {paymentMethod && ["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"].includes(paymentMethod) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                  ⚠️ Verifica que el código coincida con el ticket del POSNET
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="saleDate">Fecha de Venta</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre la venta"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/sales")}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedClient || details.length === 0 || isSubmitting}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Venta
              </>
            )}
          </Button>
        </div>

        {/* Modal del Comprobante de Pago */}
        {showReceipt && createdSale && companyData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Comprobante de Pago</h2>
                <button
                  onClick={() => {
                    setShowReceipt(false);
                    router.push("/sales");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <SaleReceipt 
                  sale={createdSale} 
                  company={companyData} 
                />
              </div>
              <div className="flex justify-end mt-4 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReceipt(false);
                    router.push("/sales");
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const printBtn = document.querySelector('.no-print') as HTMLElement;
                    if (printBtn) printBtn.click();
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALES]}>
      <NewSaleContent />
    </ProtectedRoute>
  );
}
