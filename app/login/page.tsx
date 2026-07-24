"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  console.log("🔵 [1] LoginPage: Componente renderizado");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  console.log(`🔵 [2] LoginPage: Status inicial = "${status}"`);
  console.log(`🔵 [3] LoginPage: Session inicial =`, session);

  // Efecto para detectar cambios en la sesión
  useEffect(() => {
    console.log(`🔄 [4] useEffect: Status cambiado a "${status}"`);
    console.log(`🔄 [5] useEffect: Session =`, session);
    
    if (status === "authenticated") {
      console.log(`✅ [6] useEffect: Usuario autenticado!`);
      console.log(`✅ [7] useEffect: Email = ${session?.user?.email}`);
      console.log(`✅ [8] useEffect: Rol = ${session?.user?.role}`);
      console.log(`✅ [9] useEffect: URL actual = ${window.location.href}`);
      console.log(`✅ [10] useEffect: Intentando redirigir a /dashboard...`);
      
      try {
        window.location.href = "/dashboard";
        console.log(`✅ [11] useEffect: Redirección ejecutada`);
      } catch (error) {
        console.error(`❌ [12] useEffect: Error en redirección:`, error);
      }
    }
    
    if (status === "unauthenticated") {
      console.log(`🔴 [13] useEffect: Usuario NO autenticado`);
    }
    
    if (status === "loading") {
      console.log(`🟡 [14] useEffect: Cargando sesión...`);
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`🟢 [15] handleSubmit: Formulario enviado`);
    console.log(`🟢 [16] handleSubmit: Email = ${email}`);
    console.log(`🟢 [17] handleSubmit: Password = ${password ? "****" : "vacio"}`);
    
    setError("");
    setIsLoading(true);
    console.log(`🟢 [18] handleSubmit: isLoading = true`);

    try {
      console.log(`🔄 [19] handleSubmit: Llamando a signIn...`);
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log(`📦 [20] handleSubmit: Resultado de signIn =`, result);
      console.log(`📦 [21] handleSubmit: result.status = ${result?.status}`);
      console.log(`📦 [22] handleSubmit: result.ok = ${result?.ok}`);
      console.log(`📦 [23] handleSubmit: result.error = ${result?.error}`);
      console.log(`📦 [24] handleSubmit: result.url = ${result?.url}`);

      if (result?.error) {
        console.log(`❌ [25] handleSubmit: Error en signIn: ${result.error}`);
        setError("Credenciales inválidas.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        console.log(`✅ [26] handleSubmit: Login exitoso!`);
        console.log(`✅ [27] handleSubmit: URL actual antes de redirigir = ${window.location.href}`);
        
        // Esperar un momento para que la sesión se establezca
        console.log(`⏳ [28] handleSubmit: Esperando 500ms para que la sesión se establezca...`);
        setTimeout(() => {
          console.log(`✅ [29] handleSubmit: Redirigiendo a /dashboard...`);
          console.log(`✅ [30] handleSubmit: URL actual = ${window.location.href}`);
          
          try {
            window.location.href = "/dashboard";
            console.log(`✅ [31] handleSubmit: Redirección ejecutada`);
          } catch (error) {
            console.error(`❌ [32] handleSubmit: Error en redirección:`, error);
          }
        }, 500);
      } else {
        console.log(`⚠️ [33] handleSubmit: result.ok = false`);
        setError("Error al iniciar sesión.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`❌ [34] handleSubmit: Error en login:`, error);
      setError("Error al conectar con el servidor.");
      setIsLoading(false);
    }
  };

  // Estados de renderizado
  if (status === "loading") {
    console.log(`🟡 [35] Render: Mostrando loading...`);
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
    console.log(`🟢 [36] Render: Usuario autenticado, mostrando redirección`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-2 text-gray-600">Redirigiendo al dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Email: {session?.user?.email}</p>
          <p className="text-sm text-gray-500">Rol: {session?.user?.role}</p>
        </div>
      </div>
    );
  }

  console.log(`🔵 [37] Render: Mostrando formulario de login`);
  
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