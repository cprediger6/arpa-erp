"use client";

import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES, ROLE_LABELS, MODULES, MODULE_LABELS } from "@/lib/auth/roles";
import { Plus, Edit, Trash2, Loader2, Users, Shield, Eye } from "lucide-react";

interface Permission {
  module: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canPrint: boolean;
  canViewCost: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
}

const modules = Object.values(MODULES);

function UsersContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    lastName: "",
    phone: "",
    role: "READ_ONLY",
    isActive: true,
    permissions: modules.map(module => ({
      module,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canExport: false,
      canPrint: false,
      canViewCost: false,
    })),
  });

  // Cargar usuarios
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      setError("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Abrir diálogo de edición
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      lastName: user.lastName,
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      permissions: modules.map(module => {
        const perm = user.permissions.find(p => p.module === module);
        return {
          module,
          canCreate: perm?.canCreate || false,
          canEdit: perm?.canEdit || false,
          canDelete: perm?.canDelete || false,
          canApprove: perm?.canApprove || false,
          canExport: perm?.canExport || false,
          canPrint: perm?.canPrint || false,
          canViewCost: perm?.canViewCost || false,
        };
      }),
    });
    setIsDialogOpen(true);
  };

  // Cerrar diálogo y limpiar
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setError("");
    setFormData({
      email: "",
      password: "",
      name: "",
      lastName: "",
      phone: "",
      role: "READ_ONLY",
      isActive: true,
      permissions: modules.map(module => ({
        module,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canExport: false,
        canPrint: false,
        canViewCost: false,
      })),
    });
  };

  // Guardar usuario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const submitData = {
        ...formData,
        phone: formData.phone || undefined,
        permissions: formData.permissions,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar usuario");
      }

      handleCloseDialog();
      loadUsers();
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Error al guardar el usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar usuario
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    if (id === session?.user?.id) {
      alert("No puedes eliminar tu propio usuario");
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar usuario");
      }

      loadUsers();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al eliminar el usuario");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-red-500",
      SUPERVISOR: "bg-blue-500",
      PURCHASES: "bg-green-500",
      SALES: "bg-yellow-500",
      WAREHOUSE: "bg-purple-500",
      ACCOUNTING: "bg-indigo-500",
      READ_ONLY: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y permisos del sistema
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingUser(null);
              setFormData({
                email: "",
                password: "",
                name: "",
                lastName: "",
                phone: "",
                role: "READ_ONLY",
                isActive: true,
                permissions: modules.map(module => ({
                  module,
                  canCreate: false,
                  canEdit: false,
                  canDelete: false,
                  canApprove: false,
                  canExport: false,
                  canPrint: false,
                  canViewCost: false,
                })),
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
            </DialogHeader>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos personales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    placeholder="Apellido"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+507 1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    {editingUser ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña *"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    />
                    <Label htmlFor="isActive">Usuario Activo</Label>
                  </div>
                </div>
              </div>

              {/* Permisos */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permisos
                  <span className="text-xs text-muted-foreground font-normal">
                    (Solo aplican para roles no administrativos)
                  </span>
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Módulo</TableHead>
                        <TableHead className="text-center">Crear</TableHead>
                        <TableHead className="text-center">Editar</TableHead>
                        <TableHead className="text-center">Eliminar</TableHead>
                        <TableHead className="text-center">Aprobar</TableHead>
                        <TableHead className="text-center">Exportar</TableHead>
                        <TableHead className="text-center">Imprimir</TableHead>
                        <TableHead className="text-center">Ver Costos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => {
                        const perm = formData.permissions.find(p => p.module === module);
                        const label = MODULE_LABELS[module as keyof typeof MODULE_LABELS] || module;
                        return (
                          <TableRow key={module}>
                            <TableCell className="font-medium">{label}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canCreate || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canCreate: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canEdit || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canEdit: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canDelete || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canDelete: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canApprove || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canApprove: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canExport || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canExport: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canPrint || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canPrint: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm?.canViewCost || false}
                                onCheckedChange={(checked) => {
                                  const newPerms = formData.permissions.map(p =>
                                    p.module === module ? { ...p, canViewCost: checked as boolean } : p
                                  );
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
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
                    editingUser ? "Actualizar" : "Crear"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Cargando usuarios...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2">No hay usuarios registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(user.role)}>
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "secondary"}>
                        {user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === session?.user?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <UsersContent />
    </ProtectedRoute>
  );
}