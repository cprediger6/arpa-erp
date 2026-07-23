// app/(dashboard)/layout.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  FolderOpen,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/categories", label: "Categorías", icon: FolderOpen },
    { href: "/companies", label: "Empresas", icon: Building2 },
    { href: "/products", label: "Productos", icon: Package },
    { href: "/inventory", label: "Inventario", icon: Warehouse },
    { href: "/purchases", label: "Compras", icon: ShoppingCart },
    { href: "/sales", label: "Ventas", icon: Truck },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/reports", label: "Reportes", icon: FileText },
    { href: "/settings", label: "Configuración", icon: Settings },
    
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menú móvil - Hamburguesa */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">ERP Platform</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Overlay para menú móvil */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Menú lateral */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">ERP Platform</h1>
            <p className="text-sm text-gray-500 mt-1">
              {session?.user?.companyName || "Mi Empresa"}
            </p>
          </div>

          {/* Menú */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Usuario y logout */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || ""}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className={cn(
        "lg:ml-64 p-6 pt-20 lg:pt-6",
        "transition-all duration-300"
      )}>
        {children}
      </main>
    </div>
  );
}