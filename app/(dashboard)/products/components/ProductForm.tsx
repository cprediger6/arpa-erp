// app/(dashboard)/products/components/ProductForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Loader2, ImagePlus, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

interface Variant {
  name: string;
  value: string;
  price: number;
  cost: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface ProductFormProps {
  product?: any;
  isEditing?: boolean;
}

// Componente para subir imágenes a Cloudinary
function ImageUpload({ 
  value, 
  onChange, 
  onRemove 
}: { 
  value?: string; 
  onChange: (url: string) => void; 
  onRemove?: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // ✅ Usar el endpoint de Cloudinary
      const res = await fetch('/api/cloudinary-upload-test', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }

      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
      setError(null);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    // Si hay una imagen, intentar eliminarla de Cloudinary (opcional)
    if (preview) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(preview)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
      }
    }
    
    setPreview(null);
    onChange('');
    if (onRemove) onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagen del Producto</Label>
      
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {preview ? (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
          <Image
            src={preview}
            alt="Imagen del producto"
            fill
            className="object-contain"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Imagen subida a Cloudinary
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Subiendo imagen a Cloudinary...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-500">
                Haz clic para subir una imagen
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WebP, GIF (máx. 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    description: product?.description || "",
    brand: product?.brand || "",
    model: product?.model || "",
    weight: product?.weight || 0,
    unitOfMeasure: product?.unitOfMeasure || "Unidad",
    hasIva: product?.hasIva ?? true,
    image: product?.images?.[0] || "",
    categoryId: product?.categoryId || "",
    subcategoryId: product?.subcategoryId || "",
  });
  
  const [variants, setVariants] = useState<Variant[]>(
    product?.variants && product.variants.length > 0
      ? product.variants.map((v: any) => ({
          name: v.name || "",
          value: v.value || "",
          price: v.price || 0,
          cost: v.cost || 0,
        }))
      : [{ name: "", value: "", price: 0, cost: 0 }]
  );

  // Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Error al cargar categorías");
        const data = await res.json();
        setCategories(data);
        
        if (formData.categoryId) {
          const selectedCategory = data.find((c: Category) => c.id === formData.categoryId);
          if (selectedCategory) {
            setSubcategories(selectedCategory.subcategories || []);
          }
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === "number" ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setFormData(prev => ({
      ...prev,
      categoryId,
      subcategoryId: "",
    }));

    const selectedCategory = categories.find(c => c.id === categoryId);
    setSubcategories(selectedCategory?.subcategories || []);
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image: url
    }));
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", value: "", price: 0, cost: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // app/(dashboard)/products/components/ProductForm.tsx (parte del onSubmit modificada)

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    if (!formData.name.trim()) {
      alert("El nombre del producto es requerido");
      setIsLoading(false);
      return;
    }

    // ✅ Generar SKU si no se proporciona
    const sku = formData.sku.trim() || `SKU-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;

    const url = isEditing ? `/api/products/${product.id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";
    
    const submitData = {
      ...formData,
      sku: sku,
      weight: formData.weight ? parseFloat(formData.weight as any) : null,
      images: formData.image ? [formData.image] : [],
      image: formData.image || null,
      variants: variants.map(v => ({
        ...v,
        price: Number(v.price) || 0,
        cost: Number(v.cost) || 0,
      })),
    };

    console.log('📤 Enviando datos:', submitData);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || errorData.details || "Error al guardar producto");
    }

    const result = await res.json();
    console.log('✅ Producto creado:', result);
    console.log('   ID:', result.id);
    console.log('   SKU:', result.sku);
    console.log('   InternalCode:', result.internalCode);

    router.push("/products");
    router.refresh();
  } catch (error: any) {
    console.error("❌ Error al guardar:", error);
    alert(error.message || "Error al guardar el producto");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básica</TabsTrigger>
          <TabsTrigger value="images">Imagen</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        {/* Pestaña: Información Básica */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder='Ej: Monitor Samsung 24"'
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                placeholder="Ej: MON-2450"
              />
            </div>
            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Ej: 7845632125"
              />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ej: Samsung"
              />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Ej: S24"
              />
            </div>
            <div>
              <Label htmlFor="unitOfMeasure">Unidad de Medida *</Label>
              <Input
                id="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleChange}
                required
                placeholder="Ej: Unidad, Kg, Lts"
              />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Ej: 2.5"
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={isLoadingCategories}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {isLoadingCategories && (
                <p className="text-xs text-muted-foreground mt-1">Cargando categorías...</p>
              )}
            </div>
            <div>
              <Label htmlFor="subcategoryId">Subcategoría</Label>
              <select
                id="subcategoryId"
                value={formData.subcategoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategoryId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!formData.categoryId || subcategories.length === 0}
              >
                <option value="">Sin subcategoría</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {formData.categoryId && subcategories.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Esta categoría no tiene subcategorías</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción detallada del producto"
            />
          </div>
        </TabsContent>

        {/* Pestaña: Imagen */}
        <TabsContent value="images" className="space-y-4">
          <div className="max-w-md">
            <ImageUpload
              value={formData.image}
              onChange={handleImageChange}
            />
            {formData.image && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  Imagen cargada exitosamente en Cloudinary
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Sube una imagen principal para el producto. Formatos soportados: JPG, PNG, WebP, GIF. Máximo 5MB.
            </p>
          </div>
        </TabsContent>

        {/* Pestaña: Variantes */}
        <TabsContent value="variants" className="space-y-4">
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay variantes configuradas</p>
              <Button
                type="button"
                variant="outline"
                onClick={addVariant}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Variante
              </Button>
            </div>
          ) : (
            <>
              {variants.map((variant, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Variante {index + 1}</h4>
                      {variants.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <Label>Nombre (ej: Color)</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="Ej: Color"
                        />
                      </div>
                      <div>
                        <Label>Valor (ej: Rojo)</Label>
                        <Input
                          value={variant.value}
                          onChange={(e) => updateVariant(index, "value", e.target.value)}
                          placeholder="Ej: Rojo"
                        />
                      </div>
                      <div>
                        <Label>Precio</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Costo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.cost}
                          onChange={(e) => updateVariant(index, "cost", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Variante
              </Button>
            </>
          )}
        </TabsContent>

        {/* Pestaña: Inventario */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800">Configuración de Inventario</h3>
            <p className="text-sm text-blue-600 mt-1">
              La configuración de inventario se realizará en el módulo de inventario.
            </p>
            <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
              <li>Stock por almacén</li>
              <li>Ubicaciones y posiciones</li>
              <li>Métodos de costeo (FIFO, LIFO, Promedio)</li>
              <li>Puntos de reorden</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialStock">Stock Inicial</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                placeholder="0"
                onChange={(e) => {
                  // Este campo se usa para el stock inicial, se enviará en el payload
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stock inicial para el producto (opcional)
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            isEditing ? "Actualizar Producto" : "Crear Producto"
          )}
        </Button>
      </div>
    </form>
  );
}