// hooks/use-toast.ts
import { useState } from "react";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    // Mostrar en consola para desarrollo
    console.log(`[${props.variant || "info"}] ${props.title}: ${props.description || ""}`);
    
    setToasts((prev) => [...prev, props]);
    
    // Auto limpiar después de 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  return { toast, toasts };
};