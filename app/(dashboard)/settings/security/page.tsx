// app/(dashboard)/settings/security/page.tsx
"use client";

import { useState, useEffect } from "react";
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

interface UserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    passwordExpiryDays: 90,
    preventPasswordReuse: true,
    blockSuspiciousIPs: false,
    loginNotifications: true,
    sessionConcurrency: true,
    forceLogoutAfterDays: 30,
  });
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar configuración de seguridad
      const settingsRes = await fetch("/api/settings/security", {
        credentials: "include",
      });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }

      // Cargar sesiones activas
      const sessionsRes = await fetch("/api/auth/sessions", {
        credentials: "include",
      });
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.map((s: any) => ({
          ...s,
          device: s.device || "Dispositivo desconocido",
          browser: s.browser || "Navegador desconocido",
          location: s.location || "Ubicación desconocida",
          lastActive: formatLastActive(s.lastActive),
        })));
      }

      // Cargar intentos de login
      const attemptsRes = await fetch("/api/auth/login-attempts", {
        credentials: "include",
      });
      if (attemptsRes.ok) {
        const data = await attemptsRes.json();
        setLoginAttempts(data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastActive = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diff < 60) return "Hace unos segundos";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
    return d.toLocaleDateString();
  };

  const handleSwitchChange = (key: keyof SecuritySettings, checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch("/api/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Error al guardar configuración");
      }

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm("¿Estás seguro de que deseas cerrar esta sesión?")) return;

    try {
      const res = await fetch(`/api/auth/sessions?id=${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setMessage({ type: 'success', text: 'Sesión cerrada exitosamente' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleCloseAllSessions = async () => {
  if (!confirm("¿Estás seguro de que deseas cerrar todas las sesiones?")) return;

  try {
    // ✅ Usar action=all en lugar de DELETE_ALL
    const res = await fetch("/api/auth/sessions?action=all", {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setSessions(sessions.filter(s => s.isCurrent));
      setMessage({ type: 'success', text: 'Todas las sesiones cerradas' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      const error = await res.json();
      throw new Error(error.error || "Error al cerrar sesiones");
    }
  } catch (error) {
    console.error("Error al cerrar sesiones:", error);
    setMessage({ type: 'error', text: 'Error al cerrar todas las sesiones' });
  }
};

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

      {/* Mensaje */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

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
                <p className="text-2xl font-bold">{sessions.filter(s => s.isCurrent).length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {settings.requireStrongPassword && settings.maxLoginAttempts <= 5 ? "Alto" : "Medio"}
                </p>
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
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Restaurar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
        </TabsContent>

        {/* Pestaña: Sesiones Activas */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Sesiones Activas
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleCloseAllSessions}>
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
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay sesiones activas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
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
                        <TableCell>{session.ipAddress}</TableCell>
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
                          {!session.isCurrent && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleCloseSession(session.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                  {loginAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay registros de acceso
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginAttempts.map((attempt) => (
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
                    ))
                  )}
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