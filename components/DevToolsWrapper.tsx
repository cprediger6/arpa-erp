// components/DevToolsWrapper.tsx
"use client";

import { useEffect, useState } from "react";

export function DevToolsWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Verificar si localStorage está disponible
    const isLocalStorageAvailable = () => {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    };

    setIsClient(true);

    // Si localStorage no está disponible, deshabilitar React DevTools
    if (!isLocalStorageAvailable() && process.env.NODE_ENV === 'development') {
      console.warn('localStorage no disponible, deshabilitando React DevTools');
      // @ts-ignore
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // @ts-ignore
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
      }
    }
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}