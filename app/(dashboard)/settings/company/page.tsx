"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Save, Upload, ImageIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";

interface CompanyData {
  id: string;
  name: string;
  ruc: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency: string;
  timezone: string;
  country: string;
  taxRate: number;
  logo: string | null;
  settings: {
    defaultCostMethod: string;
    allowNegativeInventory: boolean;
    taxIncluded: boolean;
  } | null;
  currencies: { code: string; name: string; isBase: boolean }[];
}

function CompanyContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ruc: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency: "USD",
    timezone: "America/Panama",
    country: "Panama",
    taxRate: 7,
    defaultCostMethod: "FIFO",
    allowNegativeInventory: false,
    taxIncluded: false,
  });

  // Cargar datos de la empresa
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) throw new Error("Error al cargar datos");
        const data = await res.json();
        setCompany(data);
        setFormData({
          name: data.name || "",
          ruc: data.ruc || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          currency: data.currency || "USD",
          timezone: data.timezone || "America/Panama",
          country: data.country || "Panama",
          taxRate: data.taxRate || 7,
          defaultCostMethod: data.settings?.defaultCostMethod || "FIFO",
          allowNegativeInventory: data.settings?.allowNegativeInventory || false,
          taxIncluded: data.settings?.taxIncluded || false,
        });
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: "Error al cargar datos de la empresa" });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompany();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar");
      }

      setMessage({ type: 'success', text: "✅ Configuración guardada exitosamente" });
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || "Error al guardar la configuración" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de la Empresa</h1>
        <p className="text-muted-foreground">
          Gestiona la información de tu empresa para facturación y configuración general
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="fiscal">Datos Fiscales</TabsTrigger>
            <TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
          </TabsList>

          {/* Información General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre de la Empresa *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Mi Empresa S.A."
                    />
                  </div>
                  <div>
                    <Label htmlFor="ruc">RUC *</Label>
                    <Input
                      id="ruc"
                      value={formData.ruc}
                      onChange={handleChange}
                      required
                      placeholder="123456789"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Calle Principal #123, Ciudad"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+507 1234-5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="info@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Panamá"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <select
                      id="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="America/Panama">Panamá (UTC-5)</option>
                      <option value="America/New_York">Nueva York (UTC-4/5)</option>
                      <option value="America/Mexico_City">México (UTC-6)</option>
                      <option value="America/Bogota">Colombia (UTC-5)</option>
                      <option value="America/Lima">Perú (UTC-5)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1/2)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datos Fiscales */}
          <TabsContent value="fiscal">
            <Card>
              <CardHeader>
                <CardTitle>Datos Fiscales y Configuración de Moneda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxRate">Impuesto (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={handleChange}
                      placeholder="7"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Moneda Base</Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {company?.currencies?.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name} {curr.isBase && "(Base)"}
                        </option>
                      ))}
                      {(!company?.currencies || company.currencies.length === 0) && (
                        <>
                          <option value="USD">USD - Dólar Estadounidense</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="PAB">PAB - Balboa Panameño</option>
                        </>
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      La moneda base se configura en el módulo de Monedas
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="taxIncluded"
                          checked={formData.taxIncluded}
                          onCheckedChange={(checked) => handleCheckboxChange("taxIncluded", checked as boolean)}
                        />
                        <Label htmlFor="taxIncluded">Los precios incluyen IVA</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuración Avanzada */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Inventario y Costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultCostMethod">Método de Costeo</Label>
                    <select
                      id="defaultCostMethod"
                      value={formData.defaultCostMethod}
                      onChange={handleChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="FIFO">FIFO (Primero en entrar, primero en salir)</option>
                      <option value="LIFO">LIFO (Último en entrar, primero en salir)</option>
                      <option value="AVERAGE">Costo Promedio</option>
                      <option value="STANDARD">Costo Estándar</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="allowNegativeInventory"
                      checked={formData.allowNegativeInventory}
                      onCheckedChange={(checked) => handleCheckboxChange("allowNegativeInventory", checked as boolean)}
                    />
                    <Label htmlFor="allowNegativeInventory">Permitir inventario negativo</Label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800">Información</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Estos ajustes afectan la forma en que se calculan los costos y se gestiona el inventario.
                  </p>
                  <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
                    <li><strong>FIFO:</strong> Los primeros productos en entrar son los primeros en salir</li>
                    <li><strong>LIFO:</strong> Los últimos productos en entrar son los primeros en salir</li>
                    <li><strong>Costo Promedio:</strong> Se calcula el costo promedio de todas las unidades</li>
                    <li><strong>Costo Estándar:</strong> Se utiliza un costo predeterminado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <CompanyContent />
    </ProtectedRoute>
  );
}