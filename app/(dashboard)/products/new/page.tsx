// app/(dashboard)/products/new/page.tsx
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { ProductForm } from "../components/ProductForm";

export default function NewProductPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.WAREHOUSE]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nuevo Producto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo producto en el catálogo
          </p>
        </div>
        <ProductForm />
      </div>
    </ProtectedRoute>
  );
}