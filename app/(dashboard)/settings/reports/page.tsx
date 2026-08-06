"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Truck,
  Receipt,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Globe,
  Clock,
  FileSpreadsheet,
  FileJson,
  File,
  Download,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
  config: any;
}

interface Settings {
  defaultCurrency: string;
  defaultTimezone: string;
  defaultCostMethod: string;
  allowNegativeInventory: boolean;
  taxIncluded: boolean;
}

function ReportsSettingsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: "USD",
    defaultTimezone: "America/Panama",
    defaultCostMethod: "FIFO",
    allowNegativeInventory: false,
    taxIncluded: false,
  });

  const [exportFormat, setExportFormat] = useState("pdf");

  // Cargar configuración
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/settings/reports");
        if (!res.ok) throw new Error("Error al cargar configuración");
        const data = await res.json();
        setReports(data.reports || []);
        setSettings(data.settings || {});
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: "Error al cargar la configuración" });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggleReport = (reportId: string) => {
    setReports(reports.map(report =>
      report.id === reportId
        ? { ...report, enabled: !report.enabled }
        : report
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports: reports.map(({ id, enabled, config }) => ({ id, enabled, config })),
          settings,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar configuración");

      setMessage({ type: 'success', text: "✅ Configuración guardada exitosamente" });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "❌ Error al guardar la configuración" });
    } finally {
      setIsSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      DollarSign,
      ShoppingCart,
      Package,
      TrendingUp,
      Users,
      Truck,
      Receipt,
    };
    const Icon = icons[iconName] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Configuración de Reportes
          </h1>
          <p className="text-muted-foreground">
            Gestiona los reportes disponibles y su configuración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <FileText className="h-4 w-4 mr-1 text-blue-600" />
            {reports.filter(r => r.enabled).length} reportes activos
          </Badge>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Reportes Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Reportes Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporte</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getIconComponent(report.icon)}
                      {report.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={() => handleToggleReport(report.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Configuración General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCurrency">Moneda por Defecto</Label>
              <select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="PAB">PAB - Balboa</option>
                <option value="MXN">MXN - Peso Mexicano</option>
              </select>
            </div>
            <div>
              <Label htmlFor="defaultTimezone">Zona Horaria</Label>
              <select
                id="defaultTimezone"
                value={settings.defaultTimezone}
                onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                <option value="America/Panama">Panamá (UTC-5)</option>
                <option value="America/New_York">Nueva York (UTC-4/5)</option>
                <option value="America/Mexico_City">México (UTC-6)</option>
                <option value="America/Bogota">Colombia (UTC-5)</option>
                <option value="America/Lima">Perú (UTC-5)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCostMethod">Método de Costeo</Label>
              <select
                id="defaultCostMethod"
                value={settings.defaultCostMethod}
                onChange={(e) => setSettings({ ...settings, defaultCostMethod: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                <option value="FIFO">FIFO</option>
                <option value="LIFO">LIFO</option>
                <option value="AVERAGE">Costo Promedio</option>
                <option value="STANDARD">Costo Estándar</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.allowNegativeInventory}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowNegativeInventory: checked })}
                />
                <Label>Permitir Inventario Negativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.taxIncluded}
                  onCheckedChange={(checked) => setSettings({ ...settings, taxIncluded: checked })}
                />
                <Label>Impuestos Incluidos</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formato de Exportación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Formato de Exportación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="exportFormat">Formato por Defecto</Label>
              <select
                id="exportFormat"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mt-1"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Button variant="outline" size="sm">
                <File className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ReportsSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <ReportsSettingsContent />
    </ProtectedRoute>
  );
}