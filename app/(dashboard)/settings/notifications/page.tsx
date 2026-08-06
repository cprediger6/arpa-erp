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
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  DollarSign,
  Users,
  Settings,
  Save,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Zap,
  Calendar,
  User,
  Building2,
  FileText,
  CreditCard,
  Shield,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit,
  MoreVertical
} from "lucide-react";

interface NotificationSettings {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lowStockAlert: boolean;
  expiredProductAlert: boolean;
  pendingOrderAlert: boolean;
  overdueInvoiceAlert: boolean;
  inactiveSupplierAlert: boolean;
  newSaleAlert: boolean;
  newPurchaseAlert: boolean;
  paymentReceivedAlert: boolean;
  userLoginAlert: boolean;
  systemUpdateAlert: boolean;
}

interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: "high" | "medium" | "low";
}

function NotificationsContent() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    whatsappNotifications: false,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlert: true,
    expiredProductAlert: true,
    pendingOrderAlert: true,
    overdueInvoiceAlert: true,
    inactiveSupplierAlert: false,
    newSaleAlert: true,
    newPurchaseAlert: true,
    paymentReceivedAlert: true,
    userLoginAlert: false,
    systemUpdateAlert: true,
  });

  const [email, setEmail] = useState("admin@empresa.com");
  const [phone, setPhone] = useState("+507 1234-5678");

  const handleSwitchChange = (key: keyof NotificationSettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  // Datos de ejemplo para historial de notificaciones
  const notificationHistory: NotificationHistory[] = [
    {
      id: "1",
      type: "Venta",
      title: "Nueva venta registrada",
      message: "Se ha registrado una nueva venta por $1,234.56",
      date: "Hace 5 minutos",
      read: false,
      priority: "high",
    },
    {
      id: "2",
      type: "Inventario",
      title: "Stock crítico: Producto A",
      message: "El producto Monitor Samsung 24 tiene solo 3 unidades disponibles",
      date: "Hace 15 minutos",
      read: false,
      priority: "high",
    },
    {
      id: "3",
      type: "Pago",
      title: "Pago recibido",
      message: "Se ha recibido el pago de la venta VEN-000001 por $1,234.56",
      date: "Hace 1 hora",
      read: true,
      priority: "medium",
    },
    {
      id: "4",
      type: "Sistema",
      title: "Actualización de sistema",
      message: "El sistema se actualizará mañana a las 2:00 AM",
      date: "Hace 3 horas",
      read: true,
      priority: "low",
    },
    {
      id: "5",
      type: "Compra",
      title: "Orden de compra pendiente",
      message: "La orden de compra OC-000001 está pendiente de aprobación",
      date: "Hace 5 horas",
      read: true,
      priority: "medium",
    },
    {
      id: "6",
      type: "Cliente",
      title: "Nuevo cliente registrado",
      message: "Se ha registrado un nuevo cliente: Juan Pérez",
      date: "Hace 1 día",
      read: true,
      priority: "low",
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Media</Badge>;
      case "low":
        return <Badge className="bg-blue-500">Baja</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Venta":
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case "Inventario":
        return <Package className="h-4 w-4 text-yellow-600" />;
      case "Pago":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "Sistema":
        return <Settings className="h-4 w-4 text-purple-600" />;
      case "Compra":
        return <Truck className="h-4 w-4 text-orange-600" />;
      case "Cliente":
        return <Users className="h-4 w-4 text-cyan-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Configuración de notificaciones y alertas del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <Bell className="h-4 w-4 mr-1 text-blue-600" />
            {notificationHistory.filter(n => !n.read).length} no leídas
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Activo
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Notificaciones</p>
                <p className="text-2xl font-bold">{notificationHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No Leídas</p>
                <p className="text-2xl font-bold">
                  {notificationHistory.filter(n => !n.read).length}
                </p>
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
                <p className="text-sm text-muted-foreground">Leídas</p>
                <p className="text-2xl font-bold">
                  {notificationHistory.filter(n => n.read).length}
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
                <p className="text-sm text-muted-foreground">Prioridad Alta</p>
                <p className="text-2xl font-bold">
                  {notificationHistory.filter(n => n.priority === "high").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Send className="h-4 w-4 mr-2" />
            Canales
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Configuración */}
        <TabsContent value="settings" className="space-y-6">
          {/* Alertas de Negocio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Alertas de Negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Stock Mínimo</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando el stock está por debajo del mínimo
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlert}
                  onCheckedChange={(checked) => handleSwitchChange("lowStockAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Producto Vencido</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando un producto está próximo a vencer
                  </p>
                </div>
                <Switch
                  checked={settings.expiredProductAlert}
                  onCheckedChange={(checked) => handleSwitchChange("expiredProductAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Orden Pendiente</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando una orden de compra está pendiente
                  </p>
                </div>
                <Switch
                  checked={settings.pendingOrderAlert}
                  onCheckedChange={(checked) => handleSwitchChange("pendingOrderAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Factura Vencida</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando una factura está próxima a vencer
                  </p>
                </div>
                <Switch
                  checked={settings.overdueInvoiceAlert}
                  onCheckedChange={(checked) => handleSwitchChange("overdueInvoiceAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Proveedor Inactivo</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando un proveedor no ha tenido actividad
                  </p>
                </div>
                <Switch
                  checked={settings.inactiveSupplierAlert}
                  onCheckedChange={(checked) => handleSwitchChange("inactiveSupplierAlert", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Transacciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Alertas de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Nueva Venta</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando se registra una nueva venta
                  </p>
                </div>
                <Switch
                  checked={settings.newSaleAlert}
                  onCheckedChange={(checked) => handleSwitchChange("newSaleAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Nueva Compra</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando se registra una nueva compra
                  </p>
                </div>
                <Switch
                  checked={settings.newPurchaseAlert}
                  onCheckedChange={(checked) => handleSwitchChange("newPurchaseAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Pago Recibido</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando se recibe un pago
                  </p>
                </div>
                <Switch
                  checked={settings.paymentReceivedAlert}
                  onCheckedChange={(checked) => handleSwitchChange("paymentReceivedAlert", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alertas de Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Alertas de Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Inicio de Sesión</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando un usuario inicia sesión desde un nuevo dispositivo
                  </p>
                </div>
                <Switch
                  checked={settings.userLoginAlert}
                  onCheckedChange={(checked) => handleSwitchChange("userLoginAlert", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Actualización del Sistema</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando hay una actualización disponible
                  </p>
                </div>
                <Switch
                  checked={settings.systemUpdateAlert}
                  onCheckedChange={(checked) => handleSwitchChange("systemUpdateAlert", checked)}
                />
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
        </TabsContent>

        {/* Pestaña: Canales */}
        <TabsContent value="channels" className="space-y-6">
          {/* Canales de Notificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Canales de Notificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones por correo electrónico
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{email}</span>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones por WhatsApp Business
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{phone}</span>
                  <Switch
                    checked={settings.whatsappNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("whatsappNotifications", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones por mensaje de texto
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{phone}</span>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("smsNotifications", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones en el navegador
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSwitchChange("pushNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Configuración de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notificationEmail">Email para notificaciones</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notificationPhone">Teléfono para notificaciones</Label>
                <Input
                  id="notificationPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+507 1234-5678"
                  className="mt-1"
                />
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
        </TabsContent>

        {/* Pestaña: Historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Historial de Notificaciones
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationHistory.map((notification) => (
                    <TableRow 
                      key={notification.id} 
                      className={!notification.read ? "bg-blue-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="text-sm">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {notification.message}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {notification.date}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                      <TableCell className="text-right">
                        {notification.read ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Leída
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500">
                            <Eye className="h-3 w-3 mr-1" />
                            No leída
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <NotificationsContent />
    </ProtectedRoute>
  );
}