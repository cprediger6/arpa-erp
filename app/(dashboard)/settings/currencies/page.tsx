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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, DollarSign } from "lucide-react";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  exchangeRate: number;
  isBase: boolean;
  isActive: boolean;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    decimalPlaces: 2,
    exchangeRate: 1,
    isBase: false,
    isActive: true,
  });

  // Cargar monedas
  const loadCurrencies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/currencies");
      if (!res.ok) throw new Error("Error al cargar monedas");
      const data = await res.json();
      setCurrencies(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar monedas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      exchangeRate: currency.exchangeRate,
      isBase: currency.isBase,
      isActive: currency.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCurrency(null);
    setFormData({
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: 2,
      exchangeRate: 1,
      isBase: false,
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCurrency 
        ? `/api/currencies/${editingCurrency.id}` 
        : "/api/currencies";
      const method = editingCurrency ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar moneda");
      }

      handleCloseDialog();
      loadCurrencies();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al guardar la moneda");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const currency = currencies.find(c => c.id === id);
    if (currency?.isBase) {
      alert("No se puede eliminar la moneda base");
      return;
    }

    if (!confirm("¿Estás seguro de eliminar esta moneda?")) return;

    try {
      const res = await fetch(`/api/currencies/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar moneda");
      }

      loadCurrencies();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al eliminar la moneda");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monedas</h1>
          <p className="text-muted-foreground">
            Gestiona las monedas de tu empresa
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCurrency(null);
              setFormData({
                code: "",
                name: "",
                symbol: "",
                decimalPlaces: 2,
                exchangeRate: 1,
                isBase: false,
                isActive: true,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Moneda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Editar Moneda" : "Nueva Moneda"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="Ej: USD, EUR, PAB"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Dólar Estadounidense"
                />
              </div>
              <div>
                <Label htmlFor="symbol">Símbolo *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  required
                  placeholder="Ej: $, €, B/."
                />
              </div>
              <div>
                <Label htmlFor="decimalPlaces">Decimales</Label>
                <Input
                  id="decimalPlaces"
                  type="number"
                  value={formData.decimalPlaces}
                  onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) || 2 })}
                  min={0}
                  max={4}
                />
              </div>
              <div>
                <Label htmlFor="exchangeRate">Tasa de Cambio (vs moneda base)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
                  min={0.0001}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isBase"
                    checked={formData.isBase}
                    onCheckedChange={(checked) => setFormData({ ...formData, isBase: checked as boolean })}
                  />
                  <Label htmlFor="isBase">Moneda Base</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                  />
                  <Label htmlFor="isActive">Activa</Label>
                </div>
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
                    editingCurrency ? "Actualizar" : "Crear"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de monedas */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Símbolo</TableHead>
                <TableHead>Decimales</TableHead>
                <TableHead>Tasa de Cambio</TableHead>
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
                      Cargando monedas...
                    </p>
                  </TableCell>
                </TableRow>
              ) : currencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2">No hay monedas configuradas</p>
                    <p className="text-sm">Crea tu primera moneda</p>
                  </TableCell>
                </TableRow>
              ) : (
                currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">
                      {currency.code}
                      {currency.isBase && (
                        <Badge className="ml-2 bg-blue-500 text-white">Base</Badge>
                      )}
                    </TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell>{currency.decimalPlaces}</TableCell>
                    <TableCell>{currency.exchangeRate}</TableCell>
                    <TableCell>
                      <Badge variant={currency.isActive ? "success" : "secondary"}>
                        {currency.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(currency.id)}
                        disabled={currency.isBase}
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