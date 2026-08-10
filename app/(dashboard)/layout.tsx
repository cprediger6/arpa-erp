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
  Building2,
  ShieldCheck,
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-2xl border-4 border-transparent border-t-blue-500 animate-spin" />
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Cargando plataforma...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/categories",
      label: "Categorías",
      icon: FolderOpen,
    },
    {
      href: "/products",
      label: "Productos",
      icon: Package,
    },
    {
      href: "/inventory",
      label: "Inventario",
      icon: Warehouse,
    },
    {
      href: "/clients",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/sales",
      label: "Ventas",
      icon: Truck,
    },
    {
      href: "/reports",
      label: "Reportes",
      icon: FileText,
    },
    {
      href: "/settings",
      label: "Configuración",
      icon: Settings,
    },
  ];

  const userInitial =
    session?.user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===================================================== */}
      {/* MOBILE HEADER */}
      {/* ===================================================== */}

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900">
                  ERP Platform
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {session?.user?.companyName || "Mi Empresa"}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile user */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            {userInitial}
          </div>
        </div>
      </header>

      {/* ===================================================== */}
      {/* MOBILE OVERLAY */}
      {/* ===================================================== */}

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[280px]",
          "border-r border-slate-200 bg-white",
          "transition-transform duration-300 ease-in-out",
          "shadow-xl shadow-slate-200/30 lg:shadow-none",
          "lg:translate-x-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">

          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <div className="border-b border-slate-100 px-6 py-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
                  <Building2 className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    ERP Platform
                  </h1>

                  <p className="mt-0.5 max-w-[170px] truncate text-xs text-slate-400">
                    {session?.user?.companyName || "Mi Empresa"}
                  </p>
                </div>
              </div>

              {/* Mobile close */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Role badge */}

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-blue-500">
                  Rol
                </p>

                <p className="truncate text-xs font-semibold text-blue-700">
                  {session?.user?.role || "Usuario"}
                </p>
              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* NAVIGATION */}
          {/* ================================================= */}

          <div className="flex-1 overflow-y-auto px-4 py-5">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Menú principal
            </p>

            <nav className="space-y-1">

              {menuItems.map((item) => {

                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3.5 py-3",
                      "text-sm font-medium",
                      "transition-all duration-200",

                      isActive
                        ? [
                            "bg-gradient-to-r from-blue-50 to-indigo-50",
                            "text-blue-700",
                            "shadow-sm",
                          ]
                        : [
                            "text-slate-600",
                            "hover:bg-slate-50",
                            "hover:text-slate-900",
                          ]
                    )}
                  >

                    {/* Active indicator */}

                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    )}

                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",

                        isActive
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-400 group-hover:bg-white group-hover:text-slate-600"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <span>{item.label}</span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}

                  </Link>
                );
              })}

            </nav>
          </div>

          {/* ================================================= */}
          {/* USER PROFILE */}
          {/* ================================================= */}

          <div className="border-t border-slate-100 p-4">

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setIsProfileOpen(!isProfileOpen)
                }
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {userInitial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {session?.user?.name || "Usuario"}
                  </p>

                  <p className="truncate text-xs text-slate-400">
                    {session?.user?.email || ""}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform",
                    isProfileOpen && "rotate-180"
                  )}
                />

              </button>

              {/* Profile menu */}

              {isProfileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50">

                  <button
                    type="button"
                    onClick={() =>
                      signOut({
                        callbackUrl: "/login",
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                      <LogOut className="h-4 w-4 text-red-500" />
                    </div>

                    <span>Cerrar sesión</span>
                  </button>

                </div>
              )}

            </div>

            {/* Security footer */}

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Sesión protegida</span>
            </div>

          </div>

        </div>
      </aside>

      {/* ===================================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================================== */}

      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          "lg:ml-[280px]",
          "pt-16 lg:pt-0"
        )}
      >

        {/* Desktop top bar */}

        <header className="hidden lg:flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-xl">

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Plataforma empresarial
            </p>

            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {session?.user?.companyName || "Mi Empresa"}
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {session?.user?.name || "Usuario"}
                </p>

                <p className="text-xs text-slate-400">
                  {session?.user?.role || "Usuario"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                {userInitial}
              </div>

            </div>

          </div>

        </header>

        {/* Page content */}

        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </div>

      </main>
    </div>
  );
}
