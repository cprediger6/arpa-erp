"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Building2,
  Users,
  Shield,
  Bell,
  FileText,
  Plug,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

const settingsModules = [
  {
    title: "Empresa",
    description: "Configuración general de la empresa",
    icon: Building2,
    href: "/settings/company",
  },
  {
    title: "Monedas",
    description: "Gestiona las monedas y tasas de cambio",
    icon: DollarSign,
    href: "/settings/currencies",
  },
  {
    title: "Usuarios",  // ✅ Nuevo
    description: "Gestiona usuarios y permisos del sistema",
    icon: Users,
    href: "/settings/users",
  },
  {
    title: "Seguridad",
    description: "Configuración de seguridad y autenticación",
    icon: Shield,
    href: "/settings/security",
  },
  {
    title: "Notificaciones",
    description: "Configuración de notificaciones y alertas",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    title: "Facturación",
    description: "Configuración de facturación electrónica",
    icon: FileText,
    href: "/settings/invoicing",
  },
  {
    title: "Integraciones",
    description: "Integraciones con servicios externos",
    icon: Plug,
    href: "/settings/integrations",
  },
  {
    title: "Impresión",
    description: "Configuración de impresoras y etiquetas",
    icon: Printer,
    href: "/settings/printing",
  },
  {
    title: "Reportes",
    description: "Configuración de reportes y exportación",
    icon: FileSpreadsheet,
    href: "/settings/reports",
  },
];

export default function SettingsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración de tu empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}