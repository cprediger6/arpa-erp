"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Cerrar menú móvil al cambiar de página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
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
      {/* Menú móvil - Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-bold text-blue-600">ERP Platform</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para menú móvil */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop y Mobile */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-72 bg-white border-r transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Desktop */}
          <div className="hidden lg:block p-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">ERP Platform</h1>
            <p className="text-sm text-gray-500 mt-1 truncate">
              {session?.user?.companyName || "Mi Empresa"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {session?.user?.role || "Usuario"}
            </p>
          </div>

          {/* Logo - Mobile (dentro del menú) */}
          <div className="lg:hidden p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-blue-600">ERP Platform</h1>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.companyName || "Mi Empresa"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-gray-100 active:scale-95",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Perfil de usuario */}
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
              className="w-full mt-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
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
        "lg:ml-72 min-h-screen transition-all duration-300",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}