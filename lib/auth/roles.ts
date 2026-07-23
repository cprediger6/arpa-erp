// lib/auth/roles.ts
export const ROLES = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  PURCHASES: "PURCHASES",
  SALES: "SALES",
  WAREHOUSE: "WAREHOUSE",
  ACCOUNTING: "ACCOUNTING",
  READ_ONLY: "READ_ONLY",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.SUPERVISOR]: "Supervisor",
  [ROLES.PURCHASES]: "Compras",
  [ROLES.SALES]: "Ventas",
  [ROLES.WAREHOUSE]: "Bodega",
  [ROLES.ACCOUNTING]: "Contabilidad",
  [ROLES.READ_ONLY]: "Solo Consulta",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.ADMIN]: "Acceso total a todas las funcionalidades",
  [ROLES.SUPERVISOR]: "Puede ver y aprobar, pero no configurar",
  [ROLES.PURCHASES]: "Gestión de compras y proveedores",
  [ROLES.SALES]: "Gestión de ventas y clientes",
  [ROLES.WAREHOUSE]: "Gestión de inventario y almacenes",
  [ROLES.ACCOUNTING]: "Acceso a reportes financieros",
  [ROLES.READ_ONLY]: "Solo puede visualizar información",
};

// Definir los módulos del sistema
export const MODULES = {
  DASHBOARD: "DASHBOARD",
  PRODUCTS: "PRODUCTS",
  INVENTORY: "INVENTORY",
  SALES: "SALES",
  PURCHASES: "PURCHASES",
  CLIENTS: "CLIENTS",
  SUPPLIERS: "SUPPLIERS",
  REPORTS: "REPORTS",
  SETTINGS: "SETTINGS",
  USERS: "USERS",
  COMPANIES: "COMPANIES",
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];

// Definir los permisos por rol
export const ROLE_PERMISSIONS: Record<Role, Module[]> = {
  [ROLES.ADMIN]: [
    MODULES.DASHBOARD,
    MODULES.PRODUCTS,
    MODULES.INVENTORY,
    MODULES.SALES,
    MODULES.PURCHASES,
    MODULES.CLIENTS,
    MODULES.SUPPLIERS,
    MODULES.REPORTS,
    MODULES.SETTINGS,
    MODULES.USERS,
    MODULES.COMPANIES,
  ],
  [ROLES.SUPERVISOR]: [
    MODULES.DASHBOARD,
    MODULES.PRODUCTS,
    MODULES.INVENTORY,
    MODULES.SALES,
    MODULES.PURCHASES,
    MODULES.CLIENTS,
    MODULES.SUPPLIERS,
    MODULES.REPORTS,
  ],
  [ROLES.PURCHASES]: [
    MODULES.DASHBOARD,
    MODULES.PRODUCTS,
    MODULES.PURCHASES,
    MODULES.SUPPLIERS,
  ],
  [ROLES.SALES]: [
    MODULES.DASHBOARD,
    MODULES.PRODUCTS,
    MODULES.SALES,
    MODULES.CLIENTS,
  ],
  [ROLES.WAREHOUSE]: [
    MODULES.DASHBOARD,
    MODULES.PRODUCTS,
    MODULES.INVENTORY,
  ],
  [ROLES.ACCOUNTING]: [
    MODULES.DASHBOARD,
    MODULES.REPORTS,
  ],
  [ROLES.READ_ONLY]: [
    MODULES.DASHBOARD,
  ],
};