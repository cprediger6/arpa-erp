"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("🔄 Status en useEffect:", status);
    console.log("🔄 Session en useEffect:", session);
    
    if (status === "authenticated") {
      console.log("✅ Autenticado, redirigiendo a /dashboard");
      // ✅ Usar window.location.assign para asegurar la redirección
      window.location.assign("/dashboard");
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔑 Intentando login con:", email);
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("📦 Resultado signIn:", result);

      if (result?.error) {
        setError("Credenciales inválidas.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        console.log("✅ Login exitoso, esperando sesión...");
        // ✅ Forzar redirección después de un breve delay
        setTimeout(() => {
          window.location.assign("/dashboard");
        }, 500);
      } else {
        setError("Error al iniciar sesión.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setError("Error al conectar con el servidor.");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-2 text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl">ERP Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@empresa.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}