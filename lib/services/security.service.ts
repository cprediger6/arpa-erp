// lib/services/security.service.ts 
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface SecuritySettings {
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

const DEFAULT_SETTINGS: SecuritySettings = {
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
};

export class SecurityService {
  static async getSettings(companyId: string): Promise<SecuritySettings> {
    try {
      // Usamos findFirst en lugar de findUnique para evitar errores de tipos
      const settings = await (prisma as any).securitySettings.findFirst({
        where: { companyId }
      });

      if (!settings) {
        // Crear settings por defecto
        const newSettings = await (prisma as any).securitySettings.create({
          data: {
            companyId,
            ...DEFAULT_SETTINGS
          }
        });
        return newSettings;
      }

      return settings;
    } catch (error) {
      console.error("Error obteniendo settings:", error);
      // Si hay error, devolver defaults
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(companyId: string, data: Partial<SecuritySettings>) {
    return (prisma as any).securitySettings.update({
      where: { companyId },
      data
    });
  }

  static async validatePassword(password: string, userId?: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const settings = userId ? await this.getSettingsByUser(userId) : DEFAULT_SETTINGS;

    if (settings.requireStrongPassword) {
      if (password.length < 8) errors.push("La contraseña debe tener al menos 8 caracteres");
      if (!/[A-Z]/.test(password)) errors.push("Debe contener al menos una mayúscula");
      if (!/[a-z]/.test(password)) errors.push("Debe contener al menos una minúscula");
      if (!/[0-9]/.test(password)) errors.push("Debe contener al menos un número");
      if (!/[^A-Za-z0-9]/.test(password)) errors.push("Debe contener al menos un símbolo especial");
    }

    // Verificar historial de contraseñas
    if (userId && settings.preventPasswordReuse) {
      try {
        const user = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: { passwordHistory: true }
        });

        if (user?.passwordHistory) {
          const history = Array.isArray(user.passwordHistory) ? user.passwordHistory : [];
          for (const oldHash of history) {
            if (await bcrypt.compare(password, oldHash)) {
              errors.push("No puedes usar una contraseña anterior");
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error verificando historial:", error);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);
    
    try {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { password: true, passwordHistory: true }
      });

      let history = [];
      if (user?.passwordHistory) {
        history = Array.isArray(user.passwordHistory) ? user.passwordHistory : [];
      }
      
      if (user?.password) {
        history.push(user.password);
        while (history.length > 5) history.shift();
      }

      await (prisma as any).user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          lastPasswordChange: new Date(),
          passwordHistory: history
        }
      });
    } catch (error) {
      console.error("Error actualizando password:", error);
      throw error;
    }
  }

  static async checkPasswordExpiry(userId: string): Promise<{ expired: boolean; daysLeft: number }> {
    try {
      const settings = await this.getSettingsByUser(userId);
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { lastPasswordChange: true }
      });

      if (!user?.lastPasswordChange) {
        return { expired: false, daysLeft: settings.passwordExpiryDays };
      }

      const daysSinceChange = Math.floor(
        (Date.now() - new Date(user.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysLeft = Math.max(0, settings.passwordExpiryDays - daysSinceChange);

      return {
        expired: daysLeft === 0,
        daysLeft
      };
    } catch (error) {
      console.error("Error checking password expiry:", error);
      return { expired: false, daysLeft: 90 };
    }
  }

  static async logLoginAttempt(data: {
    email: string;
    userId?: string;
    ipAddress: string;
    location?: string;
    userAgent?: string;
    status: 'success' | 'failed' | 'blocked';
  }) {
    try {
      return (prisma as any).loginAttempt.create({
        data
      });
    } catch (error) {
      console.error("Error logging login attempt:", error);
    }
  }

  static async checkFailedAttempts(email: string, ipAddress: string): Promise<{ blocked: boolean; attempts: number }> {
    try {
      const settings = await this.getSettingsByCompany(email);
      
      const recentAttempts = await (prisma as any).loginAttempt.count({
        where: {
          OR: [
            { email },
            { ipAddress }
          ],
          status: 'failed',
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000)
          }
        }
      });

      const blocked = recentAttempts >= settings.maxLoginAttempts;
      return { blocked, attempts: recentAttempts };
    } catch (error) {
      console.error("Error checking failed attempts:", error);
      return { blocked: false, attempts: 0 };
    }
  }

  static async blockUserIfNeeded(userId: string): Promise<void> {
    try {
      const settings = await this.getSettingsByUser(userId);
      
      const failedAttempts = await (prisma as any).loginAttempt.count({
        where: {
          userId,
          status: 'failed',
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      });

      if (failedAttempts >= settings.maxLoginAttempts) {
        await (prisma as any).user.update({
          where: { id: userId },
          data: {
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000)
          }
        });
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  }

  static async getActiveSessions(userId: string) {
    try {
      return (prisma as any).userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          lastActive: 'desc'
        }
      });
    } catch (error) {
      console.error("Error getting active sessions:", error);
      return [];
    }
  }

  static async revokeSession(sessionId: string) {
    try {
      return (prisma as any).userSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      });
    } catch (error) {
      console.error("Error revoking session:", error);
      throw error;
    }
  }

  static async revokeAllSessions(userId: string, currentSessionId: string) {
    try {
      return (prisma as any).userSession.updateMany({
        where: {
          userId,
          isActive: true,
          id: { not: currentSessionId }
        },
        data: { isActive: false }
      });
    } catch (error) {
      console.error("Error revoking all sessions:", error);
      throw error;
    }
  }

  static async getLoginHistory(companyId: string, limit: number = 50) {
    try {
      const users = await (prisma as any).user.findMany({
        where: { companyId },
        select: { id: true }
      });

      const userIds = users.map((u: any) => u.id);

      return (prisma as any).loginAttempt.findMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { email: { contains: `@` } }
          ]
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error getting login history:", error);
      return [];
    }
  }

  static async getSecurityStats(companyId: string) {
    try {
      const users = await (prisma as any).user.findMany({
        where: { companyId },
        select: { id: true }
      });
      const userIds = users.map((u: any) => u.id);

      const [totalSessions, failedAttempts, successAttempts, blockedAttempts] = await Promise.all([
        (prisma as any).userSession.count({
          where: {
            userId: { in: userIds },
            isActive: true,
            expiresAt: { gt: new Date() }
          }
        }),
        (prisma as any).loginAttempt.count({
          where: {
            userId: { in: userIds },
            status: 'failed',
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        (prisma as any).loginAttempt.count({
          where: {
            userId: { in: userIds },
            status: 'success',
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        (prisma as any).loginAttempt.count({
          where: {
            userId: { in: userIds },
            status: 'blocked',
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      const settings = await this.getSettings(companyId);
      const securityLevel = this.calculateSecurityLevel(settings);

      return {
        totalSessions,
        failedAttempts,
        successAttempts,
        blockedAttempts,
        securityLevel,
        settings
      };
    } catch (error) {
      console.error("Error getting security stats:", error);
      return {
        totalSessions: 0,
        failedAttempts: 0,
        successAttempts: 0,
        blockedAttempts: 0,
        securityLevel: 'medium' as const,
        settings: DEFAULT_SETTINGS
      };
    }
  }

  private static calculateSecurityLevel(settings: SecuritySettings): 'low' | 'medium' | 'high' {
    let score = 0;
    if (settings.twoFactorAuth) score += 2;
    if (settings.requireStrongPassword) score += 1;
    if (settings.preventPasswordReuse) score += 1;
    if (settings.blockSuspiciousIPs) score += 1;
    if (settings.loginNotifications) score += 0.5;
    if (settings.sessionTimeout <= 15) score += 0.5;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private static async getSettingsByUser(userId: string): Promise<SecuritySettings> {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });
      if (!user) return DEFAULT_SETTINGS;
      return this.getSettings(user.companyId);
    } catch (error) {
      console.error("Error getting settings by user:", error);
      return DEFAULT_SETTINGS;
    }
  }

  private static async getSettingsByCompany(email: string): Promise<SecuritySettings> {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { email },
        select: { companyId: true }
      });
      if (!user) return DEFAULT_SETTINGS;
      return this.getSettings(user.companyId);
    } catch (error) {
      console.error("Error getting settings by company:", error);
      return DEFAULT_SETTINGS;
    }
  }
}