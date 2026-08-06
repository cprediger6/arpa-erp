// lib/types/security.ts
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

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  lastActive: Date;
  expiresAt: Date;
  isActive: boolean;
  isCurrent?: boolean;
}

export interface LoginAttempt {
  id: string;
  email: string;
  userId: string | null;
  ipAddress: string;
  location: string | null;
  userAgent: string | null;
  status: "success" | "failed" | "blocked";
  timestamp: Date;
}