// app/(dashboard)/settings/page.tsx
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ROLES } from "@/lib/auth/roles";
import SettingsPageContent from "./SettingsPageContent";

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}