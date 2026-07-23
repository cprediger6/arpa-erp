"use client";
import { ProductForm } from "../components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        <p className="text-muted-foreground">
          Crea un nuevo producto en el catálogo
        </p>
      </div>
      <ProductForm />
    </div>
  );
}