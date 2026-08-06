// app/layout.client.tsx
"use client";

import { useEffect, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar nada en el servidor para evitar hidratación
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
