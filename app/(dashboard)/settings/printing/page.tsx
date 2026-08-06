// app/(dashboard)/settings/notifications/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  FileText,
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Wifi,
  Bluetooth,
  Usb,
  Server,
  Plug,
  Eye,
  Calendar,
  User,
} from "lucide-react";

interface PrinterDevice {
  id: string;
  name: string;
  type: string;
  model: string;
  connection: "usb" | "network" | "bluetooth" | "wifi";
  status: "online" | "offline" | "error" | "busy";
  default: boolean;
  lastUsed: string;
}

interface PrintTemplate {
  id: string;
  name: string;
  type: string;
  format: string;
  size: string;
  status: "active" | "inactive";
  lastModified: string;
}

interface PrintJob {
  id: string;
  document: string;
  user: string;
  printer: string;
  status: "pending" | "printing" | "completed" | "error";
  createdAt: string;
  completedAt: string | null;
  pages: number;
}

function PrintingContent() {
  const { data: session } = useSession();

  // Datos de ejemplo para impresoras
  const printers: PrinterDevice[] = [
    {
      id: "1",
      name: "Impresora Facturas",
      type: "Térmica",
      model: "Epson TM-T88VII",
      connection: "usb",
      status: "online",
      default: true,
      lastUsed: "Hace 2 minutos",
    },
    {
      id: "2",
      name: "Impresora Etiquetas",
      type: "Etiquetas",
      model: "Zebra ZD620",
      connection: "network",
      status: "online",
      default: false,
      lastUsed: "Hace 15 minutos",
    },
    {
      id: "3",
      name: "Impresora Oficina",
      type: "Multifuncional",
      model: "HP LaserJet Pro MFP M428fdw",
      connection: "wifi",
      status: "offline",
      default: false,
      lastUsed: "Hace 2 horas",
    },
    {
      id: "4",
      name: "Impresora POS",
      type: "Térmica",
      model: "Star TSP100III",
      connection: "bluetooth",
      status: "online",
      default: false,
      lastUsed: "Hace 5 minutos",
    },
  ];

  // Datos de ejemplo para plantillas
  const templates: PrintTemplate[] = [
    {
      id: "1",
      name: "Factura Estándar",
      type: "Factura",
      format: "PDF",
      size: "A4",
      status: "active",
      lastModified: "2026-07-28",
    },
    {
      id: "2",
      name: "Ticket de Venta",
      type: "Ticket",
      format: "PDF",
      size: "80mm",
      status: "active",
      lastModified: "2026-07-29",
    },
    {
      id: "3",
      name: "Etiqueta de Producto",
      type: "Etiqueta",
      format: "PDF",
      size: "100x150mm",
      status: "active",
      lastModified: "2026-07-27",
    },
    {
      id: "4",
      name: "Guía de Remisión",
      type: "Documento",
      format: "PDF",
      size: "Carta",
      status: "inactive",
      lastModified: "2026-07-20",
    },
  ];

  // Datos de ejemplo para trabajos de impresión
  const printJobs: PrintJob[] = [
    {
      id: "1",
      document: "Factura VEN-000001",
      user: "Admin",
      printer: "Impresora Facturas",
      status: "completed",
      createdAt: "2026-07-30 14:30:00",
      completedAt: "2026-07-30 14:30:30",
      pages: 1,
    },
    {
      id: "2",
      document: "Etiqueta Producto A",
      user: "Admin",
      printer: "Impresora Etiquetas",
      status: "printing",
      createdAt: "2026-07-30 14:25:00",
      completedAt: null,
      pages: 5,
    },
    {
      id: "3",
      document: "Factura VEN-000002",
      user: "Ventas",
      printer: "Impresora Facturas",
      status: "pending",
      createdAt: "2026-07-30 14:20:00",
      completedAt: null,
      pages: 2,
    },
    {
      id: "4",
      document: "Guía de Remisión",
      user: "Admin",
      printer: "Impresora Oficina",
      status: "error",
      createdAt: "2026-07-30 13:00:00",
      completedAt: null,
      pages: 3,
    },
  ];

  const getConnectionIcon = (connection: string) => {
    switch (connection) {
      case "usb":
        return <Usb className="h-4 w-4" />;
      case "network":
        return <Server className="h-4 w-4" />;
      case "bluetooth":
        return <Bluetooth className="h-4 w-4" />;
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      default:
        return <Plug className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "busy":
        return <Badge className="bg-yellow-500">Ocupado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "busy":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "printing":
        return <Badge className="bg-blue-500">Imprimiendo</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completado</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Printer className="h-8 w-8 text-blue-600" />
            Impresión
          </h1>
          <p className="text-muted-foreground">
            Configuración de impresoras, plantillas y gestión de impresión
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <Printer className="h-4 w-4 mr-1 text-blue-600" />
            {printers.filter(p => p.status === "online").length} impresoras activas
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Sistema listo
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Printer className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impresoras</p>
                <p className="text-2xl font-bold">{printers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Línea</p>
                <p className="text-2xl font-bold">
                  {printers.filter(p => p.status === "online").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impresiones Pendientes</p>
                <p className="text-2xl font-bold">
                  {printJobs.filter(j => j.status === "pending" || j.status === "printing").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Con Errores</p>
                <p className="text-2xl font-bold">
                  {printers.filter(p => p.status === "error").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="printers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="printers">
            <Printer className="h-4 w-4 mr-2" />
            Impresoras
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Clock className="h-4 w-4 mr-2" />
            Cola de Impresión
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Impresoras */}
        <TabsContent value="printers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                Dispositivos de Impresión
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Impresora
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Conexión</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Default</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-gray-600" />
                          {printer.name}
                        </div>
                      </TableCell>
                      <TableCell>{printer.type}</TableCell>
                      <TableCell>{printer.model}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getConnectionIcon(printer.connection)}
                          <span className="capitalize">{printer.connection}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {printer.lastUsed}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(printer.status)}
                          {getStatusBadge(printer.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {printer.default && (
                          <Badge className="bg-blue-500">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {printer.default ? (
                            <Button variant="ghost" size="icon" disabled>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Plantillas */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Plantillas de Impresión
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead>Última modificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          {template.name}
                        </div>
                      </TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.format}</TableCell>
                      <TableCell>{template.size}</TableCell>
                      <TableCell>{template.lastModified}</TableCell>
                      <TableCell>
                        {template.status === "active" ? (
                          <Badge className="bg-green-500">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Cola de Impresión */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Cola de Impresión
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Impresora</TableHead>
                    <TableHead>Páginas</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.document}</TableCell>
                      <TableCell>{job.user}</TableCell>
                      <TableCell>{job.printer}</TableCell>
                      <TableCell>{job.pages}</TableCell>
                      <TableCell className="text-sm">{job.createdAt}</TableCell>
                      <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {job.status === "pending" && (
                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-700">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status !== "completed" && job.status !== "error" && (
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {job.status === "completed" && (
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Configuración */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Configuración General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Configuración de Impresión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Impresión automática</p>
                    <p className="text-sm text-muted-foreground">
                      Imprimir automáticamente al generar facturas
                    </p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Impresión en dos caras</p>
                    <p className="text-sm text-muted-foreground">
                      Habilitar impresión a doble cara por defecto
                    </p>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Calidad de impresión</p>
                    <p className="text-sm text-muted-foreground">
                      Calidad por defecto para documentos
                    </p>
                  </div>
                  <select className="border rounded-md px-3 py-1">
                    <option value="draft">Borrador</option>
                    <option value="normal" selected>Normal</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Número de copias</p>
                    <p className="text-sm text-muted-foreground">
                      Copias por defecto al imprimir
                    </p>
                  </div>
                  <Input type="number" defaultValue={1} className="w-20" min={1} max={10} />
                </div>
              </CardContent>
            </Card>

            {/* Formato de Documentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Formato de Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceFormat">Formato de Factura</Label>
                    <select id="invoiceFormat" className="w-full border rounded-md px-3 py-2 mt-1">
                      <option value="a4">A4</option>
                      <option value="letter">Carta</option>
                      <option value="thermal" selected>Ticket Térmico</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="labelFormat">Formato de Etiquetas</Label>
                    <select id="labelFormat" className="w-full border rounded-md px-3 py-2 mt-1">
                      <option value="100x150" selected>100x150mm</option>
                      <option value="80x120">80x120mm</option>
                      <option value="60x80">60x80mm</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón Guardar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Restaurar
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PrintingSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <PrintingContent />
    </ProtectedRoute>
  );
}