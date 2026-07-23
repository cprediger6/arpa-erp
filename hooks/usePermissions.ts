// hooks/usePermissions.ts
import { useSession } from "next-auth/react";
import { Role, Module, ROLE_PERMISSIONS } from "@/lib/auth/roles";

export function usePermissions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  const hasModule = (module: Module): boolean => {
    if (!userRole) return false;
    if (userRole === "ADMIN") return true;
    return ROLE_PERMISSIONS[userRole]?.includes(module) || false;
  };

  const hasAnyModule = (modules: Module[]): boolean => {
    return modules.some(module => hasModule(module));
  };

  const hasAllModules = (modules: Module[]): boolean => {
    return modules.every(module => hasModule(module));
  };

  const isAdmin = userRole === "ADMIN";
  const isSales = userRole === "SALES";
  const isPurchases = userRole === "PURCHASES";
  const isWarehouse = userRole === "WAREHOUSE";
  const isAccounting = userRole === "ACCOUNTING";
  const isReadOnly = userRole === "READ_ONLY";
  const isSupervisor = userRole === "SUPERVISOR";

  return {
    userRole,
    hasModule,
    hasAnyModule,
    hasAllModules,
    isAdmin,
    isSales,
    isPurchases,
    isWarehouse,
    isAccounting,
    isReadOnly,
    isSupervisor,
  };
}