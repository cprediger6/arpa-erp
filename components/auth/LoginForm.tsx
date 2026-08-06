// components/auth/LoginForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail, AlertCircle, Building2 } from "lucide-react";

// Helper para verificar localStorage
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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    // Verificar disponibilidad de localStorage
    setStorageAvailable(isLocalStorageAvailable());
    
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage no está disponible. Algunas funcionalidades pueden no funcionar correctamente.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        console.error("Error de login:", res.error);
        
        if (res.error === "CredentialsSignin") {
          setError("Credenciales incorrectas. Por favor, verifica tu correo y contraseña.");
        } else if (res.error === "MissingCSRF") {
          setError("Error de seguridad. Por favor, intenta nuevamente.");
          // Intentar recargar después de un breve momento
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setError("Error al iniciar sesión. Intenta nuevamente.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error inesperado al iniciar sesión. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar advertencia si localStorage no está disponible
  if (!storageAvailable) {
    return (
      <Card className="w-full max-w-md shadow-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Advertencia</CardTitle>
          <CardDescription>
            El navegador está bloqueando el almacenamiento local.
            <br />
            <span className="text-sm text-yellow-600">
              Por favor, desactiva el modo InPrivate/Incógnito o ajusta la configuración de privacidad.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-md mx-4">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">ERP Corporativo</CardTitle>
        <CardDescription>Ingresa al panel multiactivo de tu empresa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="usuario@empresa.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-md font-medium transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}