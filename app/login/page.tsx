"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  console.log("🔵 1. LoginPage renderizado");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  console.log("🔵 2. Status de sesión:", status);
  console.log("🔵 3. Session data:", session);

  // ✅ Efecto para detectar cambios en la sesión
  useEffect(() => {
    console.log("🔵 4. useEffect ejecutado - Status:", status);
    console.log("🔵 5. useEffect - Session:", session);
    
    if (status === "authenticated") {
      console.log("🟢 6. Sesión autenticada, intentando redirigir...");
      console.log("🟢 7. URL actual:", window.location.href);
      
      // Intentar redirigir
      try {
        console.log("🟢 8. Ejecutando window.location.href = '/dashboard'");
        window.location.href = "/dashboard";
        console.log("🟢 9. Redirección ejecutada");
      } catch (error) {
        console.error("🔴 10. Error en redirección:", error);
      }
    }
    
    if (status === "unauthenticated") {
      console.log("🟡 11. Usuario no autenticado");
    }
    
    if (status === "loading") {
      console.log("🟡 12. Cargando sesión...");
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 13. Formulario enviado");
    console.log("🟢 14. Email:", email);
    console.log("🟢 15. Password:", password ? "****" : "vacio");
    
    setError("");
    setIsLoading(true);
    console.log("🟢 16. isLoading = true");

    try {
      console.log("🔄 17. Intentando signIn con credentials...");
      console.log("🔄 18. Datos a enviar:", { email, password: "****" });
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("📦 19. Resultado de signIn:", result);
      console.log("📦 20. Resultado - status:", result?.status);
      console.log("📦 21. Resultado - ok:", result?.ok);
      console.log("📦 22. Resultado - error:", result?.error);
      console.log("📦 23. Resultado - url:", result?.url);

      if (result?.error) {
        console.log("❌ 24. Error en signIn:", result.error);
        setError("Credenciales inválidas. Verifica tu email y contraseña.");
        setIsLoading(false);
        console.log("🟢 25. isLoading = false (por error)");
        return;
      }

      if (result?.ok) {
        console.log("✅ 26. Login exitoso!");
        console.log("✅ 27. Esperando 1 segundo para que la sesión se establezca...");
        
        // Esperar un momento para que la sesión se guarde
        setTimeout(() => {
          console.log("✅ 28. Timeout completado, verificando sesión...");
          console.log("✅ 29. Status actual:", status);
          console.log("✅ 30. Session actual:", session);
          
          console.log("✅ 31. Intentando redirección manual...");
          console.log("✅ 32. URL antes de redirigir:", window.location.href);
          
          // Intentar múltiples métodos de redirección
          try {
            console.log("✅ 33. Método 1: window.location.href");
            window.location.href = "/dashboard";
            console.log("✅ 34. Método 1 ejecutado");
          } catch (e) {
            console.error("🔴 35. Error en método 1:", e);
          }
          
          // Si el método 1 falla, intentar con replace
          setTimeout(() => {
            console.log("✅ 36. Método 2: window.location.replace");
            try {
              window.location.replace("/dashboard");
              console.log("✅ 37. Método 2 ejecutado");
            } catch (e) {
              console.error("🔴 38. Error en método 2:", e);
            }
          }, 100);
        }, 1000);
      } else {
        console.log("⚠️ 39. Resultado ok: false");
        setError("Error al iniciar sesión. Intenta nuevamente.");
        setIsLoading(false);
        console.log("🟢 40. isLoading = false (por ok false)");
      }
    } catch (error) {
      console.error("❌ 41. Error en login:", error);
      console.error("❌ 42. Detalles del error:", JSON.stringify(error, null, 2));
      setError("Error al conectar con el servidor.");
      setIsLoading(false);
      console.log("🟢 43. isLoading = false (por catch)");
    }
  };

  // Estado de carga
  if (status === "loading") {
    console.log("🟡 44. Mostrando loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar mensaje
  if (status === "authenticated") {
    console.log("🟢 45. Usuario autenticado, mostrando mensaje de redirección");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-2 text-gray-600">Redirigiendo al dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Status: {status}</p>
          <p className="text-sm text-gray-500">Email: {session?.user?.email}</p>
        </div>
      </div>
    );
  }

  console.log("🔵 46. Mostrando formulario de login");
  
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
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