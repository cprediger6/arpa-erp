// hooks/useSecurity.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SecuritySettings } from '@/lib/services/security.service';

// ✅ Agregar isCurrent al tipo Session
interface Session {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: Date | string;
  isActive: boolean;
  expiresAt: Date | string;
  isCurrent: boolean; // ✅ Agregado
}

interface LoginAttempt {
  id: string;
  email: string;
  userId: string | null;
  ipAddress: string;
  location: string | null;
  timestamp: Date | string;
  status: 'success' | 'failed' | 'blocked';
  user?: {
    name: string;
    lastName: string;
    email: string;
  };
}

interface SecurityStats {
  totalSessions: number;
  failedAttempts: number;
  successAttempts: number;
  blockedAttempts: number;
  securityLevel: 'low' | 'medium' | 'high';
  settings: SecuritySettings;
}

export function useSecurity() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = useCallback(async () => {
    if (!session?.user?.companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Obtener settings
      const settingsRes = await fetch('/api/settings/security');
      if (!settingsRes.ok) throw new Error('Error al obtener settings');
      const settingsData = await settingsRes.json();
      // ✅ Extraer data si existe
      setSettings(settingsData.data || settingsData);

      // Obtener sesiones activas
      const sessionsRes = await fetch('/api/sessions');
      if (!sessionsRes.ok) throw new Error('Error al obtener sesiones');
      const sessionsData = await sessionsRes.json();
      // ✅ Extraer data si existe
      setSessions(sessionsData.data || sessionsData || []);

      // Obtener historial de login
      const loginRes = await fetch('/api/auth/login-attempts?limit=50');
      if (!loginRes.ok) throw new Error('Error al obtener historial');
      const loginData = await loginRes.json();
      // ✅ Extraer data si existe
      setLoginAttempts(loginData.attempts || loginData.data?.attempts || []);
      setStats(loginData.stats || loginData.data?.stats || null);
    } catch (err) {
      console.error('Error en useSecurity:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos de seguridad');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.companyId]);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const updateSettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error('Error al actualizar settings');

      const updated = await response.json();
      setSettings(updated.data || updated);
      return updated;
    } catch (err) {
      console.error('Error actualizando settings:', err);
      throw err;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error('Error al cerrar sesión');

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      throw err;
    }
  };

  const revokeAllSessions = async () => {
    try {
      const response = await fetch('/api/sessions/logout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: session?.user?.id }),
      });

      if (!response.ok) throw new Error('Error al cerrar sesiones');

      // ✅ Mantener solo la sesión actual (isCurrent === true)
      setSessions((prev) => prev.filter((s) => s.isCurrent === true));
      return true;
    } catch (err) {
      console.error('Error cerrando todas las sesiones:', err);
      throw err;
    }
  };

  const refresh = async () => {
    await fetchSecurityData();
  };

  return {
    settings,
    sessions,
    loginAttempts,
    stats,
    isLoading,
    error,
    updateSettings,
    revokeSession,
    revokeAllSessions,
    refresh,
  };
}