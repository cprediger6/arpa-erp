"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Loader2, Users } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  ruc: string | null;
  address: string | null;
  contactPerson: string | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  isActive: boolean;
  _count: {
    sales: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ruc: "",
    address: "",
    contactPerson: "",
    creditLimit: "",
    paymentTerms: "",
    isActive: true,
  });

  // Cargar clientes
  const loadClients = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error("Error al cargar clientes");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [search]);

  // Abrir diálogo de edición
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      ruc: client.ruc || "",
      address: client.address || "",
      contactPerson: client.contactPerson || "",
      creditLimit: client.creditLimit?.toString() || "",
      paymentTerms: client.paymentTerms || "",
      isActive: client.isActive,
    });
    setIsDialogOpen(true);
  };

  // Cerrar diálogo y limpiar
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      ruc: "",
      address: "",
      contactPerson: "",
      creditLimit: "",
      paymentTerms: "",
      isActive: true,
    });
  };

  // Guardar cliente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingClient 
        ? `/api/clients/${editingClient.id}` 
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const submitData = {
        ...formData,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar cliente");
      }

      handleCloseDialog();
      loadClients();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al guardar el cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar cliente
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar cliente");
      }

      loadClients();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al eliminar el cliente");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona la base de datos de clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingClient(null);
              setFormData({
                name: "",
                email: "",
                phone: "",
                ruc: "",
                address: "",
                contactPerson: "",
                creditLimit: "",
                paymentTerms: "",
                isActive: true,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nombre completo del cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
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
                  <Label htmlFor="ruc">RUC</Label>
                  <Input
                    id="ruc"
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Persona de Contacto</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Nombre del contacto"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Límite de Crédito</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Términos de Pago</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="Ej: 30 días"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Cliente Activo</span>
                  </label>
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
                    editingClient ? "Actualizar" : "Crear"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o RUC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Cargando clientes...
                    </p>
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2">No hay clientes registrados</p>
                    <p className="text-sm">Crea tu primer cliente para empezar</p>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{client.ruc || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client._count.sales}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.isActive ? "success" : "secondary"}>
                        {client.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(client.id)}
                        disabled={client._count.sales > 0}
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