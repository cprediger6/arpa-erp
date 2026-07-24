"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🔵 [L1] DashboardLayout: Renderizando");
  
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  console.log(`🔵 [L2] DashboardLayout: Status = ${status}`);
  console.log(`🔵 [L3] DashboardLayout: Session =`, session);
  console.log(`🔵 [L4] DashboardLayout: Pathname = ${pathname}`);

  useEffect(() => {
    console.log(`🔄 [L5] DashboardLayout useEffect: Status = ${status}`);
    console.log(`🔄 [L6] DashboardLayout useEffect: Session =`, session);
    
    if (status === "unauthenticated") {
      console.log(`🔴 [L7] DashboardLayout: No autenticado, redirigiendo a login`);
      window.location.href = "/login";
    }
    
    if (status === "authenticated") {
      console.log(`✅ [L8] DashboardLayout: Autenticado correctamente`);
    }
  }, [status, session]);

  if (status === "loading") {
    console.log(`🟡 [L9] DashboardLayout: Cargando...`);
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    console.log(`🔴 [L10] DashboardLayout: No hay sesión`);
    return null;
  }

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/categories", label: "Categorías", icon: FolderOpen },
    { href: "/products", label: "Productos", icon: Package },
    { href: "/inventory", label: "Inventario", icon: Warehouse },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/sales", label: "Ventas", icon: Truck },
    { href: "/reports", label: "Reportes", icon: FileText },
    { href: "/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... resto del layout ... */}
      <main className={cn(
        "lg:ml-64 p-6 pt-20 lg:pt-6",
        "transition-all duration-300"
      )}>
        {children}
      </main>
    </div>
  );
}