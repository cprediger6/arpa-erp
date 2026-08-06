// app/(dashboard)/settings/printing/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Shield,
  Key,
  Lock,
  AlertTriangle,
  Activity,
  Globe,
  Save,
  RefreshCw,
  LogOut,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  History,
  Settings as SettingsIcon,
  User,
  Monitor,
  MapPin,
  Calendar
} from "lucide-react";

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireStrongPassword: boolean;
  passwordExpiryDays: number;
  preventPasswordReuse: boolean;
  blockSuspiciousIPs: boolean;
  loginNotifications: boolean;
  sessionConcurrency: boolean;
  forceLogoutAfterDays: number;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  location: string;
  timestamp: string;
  status: "success" | "failed" | "blocked";
}

function SecurityContent() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    passwordExpiryDays: 90,
    preventPasswordReuse: true,
    blockSuspiciousIPs: false,
    loginNotifications: true,
    sessionConcurrency: false,
    forceLogoutAfterDays: 30,
  });

  const handleSwitchChange = (key: keyof SecuritySettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  // Datos de ejemplo
  const activeSessions: Session[] = [
    {
      id: "1",
      device: "MacBook Pro 16",
      browser: "Chrome 120",
      ip: "192.168.1.100",
      location: "Panamá, Panamá",
      lastActive: "Hace 2 minutos",
      isCurrent: true,
    },
    {
      id: "2",
      device: "iPhone 15 Pro",
      browser: "Safari",
      ip: "192.168.1.101",
      location: "Panamá, Panamá",
      lastActive: "Hace 3 horas",
      isCurrent: false,
    },
    {
      id: "3",
      device: "iPad Air",
      browser: "Chrome",
      ip: "192.168.1.102",
      location: "Colón, Panamá",
      lastActive: "Hace 1 día",
      isCurrent: false,
    },
  ];

  const loginAttempts: LoginAttempt[] = [
    {
      id: "1",
      email: "admin@empresa.com",
      ip: "192.168.1.100",
      location: "Panamá, Panamá",
      timestamp: "2026-07-30 14:30:00",
      status: "success",
    },
    {
      id: "2",
      email: "admin@empresa.com",
      ip: "192.168.1.150",
      location: "Colón, Panamá",
      timestamp: "2026-07-30 13:15:00",
      status: "success",
    },
    {
      id: "3",
      email: "usuario@test.com",
      ip: "192.168.1.200",
      location: "David, Panamá",
      timestamp: "2026-07-30 12:00:00",
      status: "failed",
    },
    {
      id: "4",
      email: "admin@empresa.com",
      ip: "192.168.1.250",
      location: "Santiago, Panamá",
      timestamp: "2026-07-30 10:30:00",
      status: "success",
    },
    {
      id: "5",
      email: "invasor@test.com",
      ip: "10.0.0.100",
      location: "Ciudad de México, México",
      timestamp: "2026-07-30 08:15:00",
      status: "blocked",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 hover:bg-green-600">✅ Exitoso</Badge>;
      case "failed":
        return <Badge variant="destructive">❌ Fallido</Badge>;
      case "blocked":
        return <Badge className="bg-orange-500 hover:bg-orange-600">🚫 Bloqueado</Badge>;
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
            <Shield className="h-8 w-8 text-blue-600" />
            Seguridad
          </h1>
          <p className="text-muted-foreground">
            Configuración de seguridad y autenticación del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 mr-1 text-blue-600" />
            Protección Activa
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4 mr-1" />
            Todo seguro
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sesiones Activas</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intentos Fallidos</p>
                <p className="text-2xl font-bold">
                  {loginAttempts.filter(a => a.status === "failed").length}
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
                <p className="text-sm text-muted-foreground">Accesos Exitosos</p>
                <p className="text-2xl font-bold">
                  {loginAttempts.filter(a => a.status === "success").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nivel de Seguridad</p>
                <p className="text-2xl font-bold text-green-600">Alto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="h-4 w-4 mr-2" />
            Sesiones Activas
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Registro de Acceso
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Configuración */}
        <TabsContent value="settings" className="space-y-6">
          {/* Autenticación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Autenticación de Dos Factores (2FA)</p>
                  <p className="text-sm text-muted-foreground">
                    Requiere código adicional al iniciar sesión
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {settings.twoFactorAuth && (
                    <Badge className="bg-green-500 hover:bg-green-600">Activado</Badge>
                  )}
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSwitchChange("twoFactorAuth", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Notificaciones de Login</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar alerta por email al iniciar sesión desde un nuevo dispositivo
                  </p>
                </div>
                <Switch
                  checked={settings.loginNotifications}
                  onCheckedChange={(checked) => handleSwitchChange("loginNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Sesiones Concurrentes</p>
                  <p className="text-sm text-muted-foreground">
                    Permitir múltiples sesiones activas por usuario
                  </p>
                </div>
                <Switch
                  checked={settings.sessionConcurrency}
                  onCheckedChange={(checked) => handleSwitchChange("sessionConcurrency", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Políticas de Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Políticas de Contraseña
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Contraseña Fuerte</p>
                  <p className="text-sm text-muted-foreground">
                    Requiere mayúsculas, minúsculas, números y símbolos
                  </p>
                </div>
                <Switch
                  checked={settings.requireStrongPassword}
                  onCheckedChange={(checked) => handleSwitchChange("requireStrongPassword", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Expiración de Contraseña</p>
                  <p className="text-sm text-muted-foreground">
                    Días hasta que la contraseña expire
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.passwordExpiryDays}
                    onChange={(e) => setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                    className="w-24"
                    min={30}
                    max={365}
                  />
                  <span className="text-sm text-muted-foreground">días</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Cierre Forzado</p>
                  <p className="text-sm text-muted-foreground">
                    Forzar cierre de sesión después de X días de inactividad
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.forceLogoutAfterDays}
                    onChange={(e) => setSettings({ ...settings, forceLogoutAfterDays: parseInt(e.target.value) || 30 })}
                    className="w-24"
                    min={1}
                    max={90}
                  />
                  <span className="text-sm text-muted-foreground">días</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Evitar Reutilización</p>
                  <p className="text-sm text-muted-foreground">
                    No permitir usar contraseñas anteriores
                  </p>
                </div>
                <Switch
                  checked={settings.preventPasswordReuse}
                  onCheckedChange={(checked) => handleSwitchChange("preventPasswordReuse", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seguridad Avanzada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Seguridad Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Bloquear IPs Sospechosas</p>
                  <p className="text-sm text-muted-foreground">
                    Bloquear automáticamente IPs con actividad maliciosa
                  </p>
                </div>
                <Switch
                  checked={settings.blockSuspiciousIPs}
                  onCheckedChange={(checked) => handleSwitchChange("blockSuspiciousIPs", checked)}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Tiempo de Sesión</p>
                  <p className="text-sm text-muted-foreground">
                    Minutos antes de cerrar sesión automáticamente
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    className="w-24"
                    min={5}
                    max={480}
                  />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Intentos de Login</p>
                  <p className="text-sm text-muted-foreground">
                    Máximo de intentos fallidos antes de bloquear
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    className="w-24"
                    min={3}
                    max={10}
                  />
                  <span className="text-sm text-muted-foreground">intentos</span>
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
        </TabsContent>

        {/* Pestaña: Sesiones Activas */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Sesiones Activas
              </CardTitle>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Todas
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Navegador</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id} className={session.isCurrent ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {session.device}
                          {session.isCurrent && (
                            <Badge className="bg-blue-500 text-white text-xs">Actual</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{session.browser}</TableCell>
                      <TableCell>{session.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {session.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {session.lastActive}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Registro de Acceso */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Registro de Acceso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {attempt.email}
                        </div>
                      </TableCell>
                      <TableCell>{attempt.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {attempt.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {attempt.timestamp}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(attempt.status)}
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

export default function SecuritySettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <SecurityContent />
    </ProtectedRoute>
  );
}