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
  Plug,
  ShoppingCart,
  Store,
  Package,
  MessageSquare,
  Mail,
  CreditCard,
  DollarSign,
  Globe,
  Key,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  GitBranch,
  Code,
  Link,
  Unlink,
  FileText,
  FileJson,
  Terminal,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error" | "pending";
  apiKey: string;
  lastSync: string;
  enabled: boolean;
  icon: any;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTrigger: string;
  attempts: number;
  successRate: number;
}

function IntegrationsContent() {
  const { data: session } = useSession();

  // Datos de ejemplo para integraciones - TODAS LAS CLAVES SON DE EJEMPLO
  const integrations: Integration[] = [
    {
      id: "1",
      name: "WooCommerce",
      type: "E-commerce",
      status: "active",
      apiKey: "ck_example_woocommerce_key_123456",
      lastSync: "Hace 5 minutos",
      enabled: true,
      icon: ShoppingCart,
    },
    {
      id: "2",
      name: "Shopify",
      type: "E-commerce",
      status: "active",
      apiKey: "shp_example_shopify_key_123456",
      lastSync: "Hace 15 minutos",
      enabled: true,
      icon: Store,
    },
    {
      id: "3",
      name: "Mercado Libre",
      type: "E-commerce",
      status: "pending",
      apiKey: "ml_example_mercadolibre_key_123456",
      lastSync: "Nunca",
      enabled: false,
      icon: ShoppingCart,
    },
    {
      id: "4",
      name: "Amazon",
      type: "E-commerce",
      status: "inactive",
      apiKey: "amzn_example_amazon_key_123456",
      lastSync: "Hace 2 días",
      enabled: false,
      icon: Package,
    },
    {
      id: "5",
      name: "WhatsApp Business",
      type: "Comunicación",
      status: "active",
      apiKey: "wa_example_whatsapp_key_123456",
      lastSync: "Hace 1 hora",
      enabled: true,
      icon: MessageSquare,
    },
    {
      id: "6",
      name: "Email Marketing",
      type: "Comunicación",
      status: "error",
      apiKey: "em_example_email_key_123456",
      lastSync: "Hace 3 horas",
      enabled: true,
      icon: Mail,
    },
    {
      id: "7",
      name: "Stripe",
      type: "Pagos",
      status: "active",
      apiKey: "sk_example_stripe_key_123456",
      lastSync: "Hace 10 minutos",
      enabled: true,
      icon: CreditCard,
    },
    {
      id: "8",
      name: "PayPal",
      type: "Pagos",
      status: "inactive",
      apiKey: "pp_example_paypal_key_123456",
      lastSync: "Hace 5 días",
      enabled: false,
      icon: DollarSign,
    },
  ];

  // Datos de ejemplo para webhooks
  const webhooks: Webhook[] = [
    {
      id: "1",
      name: "Ventas Webhook",
      url: "https://api.ejemplo.com/webhooks/sales",
      events: ["venta.creada", "venta.actualizada", "venta.cobrada"],
      active: true,
      lastTrigger: "Hace 2 minutos",
      attempts: 1523,
      successRate: 99.8,
    },
    {
      id: "2",
      name: "Inventario Webhook",
      url: "https://api.ejemplo.com/webhooks/inventory",
      events: ["inventario.actualizado", "stock.critico"],
      active: true,
      lastTrigger: "Hace 15 minutos",
      attempts: 876,
      successRate: 98.5,
    },
    {
      id: "3",
      name: "Clientes Webhook",
      url: "https://api.ejemplo.com/webhooks/clients",
      events: ["cliente.creado", "cliente.actualizado"],
      active: false,
      lastTrigger: "Hace 2 días",
      attempts: 234,
      successRate: 95.2,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-8 w-8 text-blue-600" />
            Integraciones
          </h1>
          <p className="text-muted-foreground">
            Conecta tu ERP con servicios externos y plataformas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <Plug className="h-4 w-4 mr-1 text-blue-600" />
            {integrations.filter(i => i.status === "active").length} activas
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Conectado
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Plug className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Integraciones</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
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
                <p className="text-sm text-muted-foreground">Activas</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === "active").length}
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
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === "pending").length}
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
                  {integrations.filter(i => i.status === "error").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platforms">
            <Globe className="h-4 w-4 mr-2" />
            Plataformas
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <GitBranch className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Code className="h-4 w-4 mr-2" />
            APIs y Keys
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Plataformas */}
        <TabsContent value="platforms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Integraciones con Plataformas
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Integración
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Última Sincronización</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => {
                    const Icon = integration.icon;
                    return (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className="h-5 w-5 text-gray-700" />
                            </div>
                            <span className="font-medium">{integration.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{integration.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {integration.apiKey.slice(0, 10)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {integration.lastSync}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(integration.status)}
                            {getStatusBadge(integration.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {integration.enabled ? (
                              <Button variant="ghost" size="icon">
                                <Link className="h-4 w-4 text-green-500" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon">
                                <Unlink className="h-4 w-4 text-gray-400" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-600" />
                Webhooks Configurados
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Webhook
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Último Disparo</TableHead>
                    <TableHead>Intentos</TableHead>
                    <TableHead>Éxito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {webhook.lastTrigger}
                        </div>
                      </TableCell>
                      <TableCell>{webhook.attempts}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">
                          {webhook.successRate}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {webhook.active ? (
                          <Badge className="bg-green-500">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
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

        {/* Pestaña: APIs y Keys */}
        <TabsContent value="apis">
          <div className="space-y-6">
            {/* API Keys */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  API Keys
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generar API Key
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Último uso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">API Producción</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          sk_live_example_production_key_123456
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">Leer</Badge>
                          <Badge variant="outline" className="text-xs">Escribir</Badge>
                          <Badge variant="outline" className="text-xs">Ventas</Badge>
                        </div>
                      </TableCell>
                      <TableCell>Hace 5 minutos</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Activa</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Desarrollo</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          sk_test_example_development_key_123456
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">Leer</Badge>
                          <Badge variant="outline" className="text-xs">Escribir</Badge>
                        </div>
                      </TableCell>
                      <TableCell>Hace 2 horas</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">Prueba</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Documentación API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documentación API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">Documentación</span>
                    <span className="text-sm text-muted-foreground">Guía completa de API</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <FileJson className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">API Reference</span>
                    <span className="text-sm text-muted-foreground">Endpoints y ejemplos</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Terminal className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">Postman Collection</span>
                    <span className="text-sm text-muted-foreground">Importar en Postman</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <IntegrationsContent />
    </ProtectedRoute>
  );
}