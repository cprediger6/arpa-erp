"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MODULES } from "@/lib/auth/roles";
import SettingsPageContent from "./SettingsPageContent";

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div>Contenido de Configuración</div>
    </ProtectedRoute>
  );
}