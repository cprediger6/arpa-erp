"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { ProductForm } from "../../components/ProductForm";
import { Loader2 } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error("Error al cargar producto");
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground">
            Modifica la información del producto
          </p>
        </div>
        <ProductForm product={product} isEditing />
      </div>
    </ProtectedRoute>
  );
}