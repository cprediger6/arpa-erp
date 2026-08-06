"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, FolderOpen, Eye } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";

interface Category {
  id: string;
  name: string;
  description: string | null;
  _count: { products: number };
  subcategories: any[];
}

function CategoriesContent() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Verificar si el usuario puede modificar categorías
  const canModify = session?.user?.role === "ADMIN" || 
                    session?.user?.role === "SUPERVISOR" || 
                    session?.user?.role === "WAREHOUSE";
  const isSalesRole = session?.user?.role === "SALES";

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar categorías");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (category: Category) => {
    if (!canModify) return;
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    setIsSubmitting(true);

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}` 
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar categoría");
      }

      handleCloseDialog();
      loadCategories();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al guardar la categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canModify) return;
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar categoría");
      }

      loadCategories();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al eliminar la categoría");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">
            {isSalesRole 
              ? "Visualización de categorías (solo consulta)" 
              : "Organiza tus productos por categorías"
            }
          </p>
        </div>
        {canModify ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", description: "" });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Electrónicos"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción de la categoría"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      editingCategory ? "Actualizar" : "Crear"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Badge variant="outline" className="px-4 py-2">
            <Eye className="h-4 w-4 mr-2" />
            Solo consulta
          </Badge>
        )}
      </div>

      {/* Tabla de categorías */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Subcategorías</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cargando categorías...
                    </p>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2">No hay categorías registradas</p>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category.subcategories.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {category._count.products}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canModify ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(category.id)}
                            disabled={category._count.products > 0 || category.subcategories.length > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="px-3 py-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WAREHOUSE", "SALES"]}>
      <CategoriesContent />
    </ProtectedRoute>
  );
}