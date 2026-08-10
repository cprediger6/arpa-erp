"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  Building2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const isLocalStorageAvailable = () => {
  try {
    const test = "test";
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
  const callbackUrl =
    searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    setStorageAvailable(isLocalStorageAvailable());

    if (!isLocalStorageAvailable()) {
      console.warn(
        "localStorage no está disponible. Algunas funcionalidades pueden no funcionar correctamente."
      );
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
          setError(
            "Credenciales incorrectas. Por favor, verifica tu correo y contraseña."
          );
        } else if (res.error === "MissingCSRF") {
          setError(
            "Error de seguridad. Por favor, intenta nuevamente."
          );

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setError(
            "Error al iniciar sesión. Intenta nuevamente."
          );
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError(
        "Error inesperado al iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Advertencia cuando localStorage no está disponible
   */
  if (!storageAvailable) {
    return (
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-2xl shadow-2xl">
          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/10 border border-yellow-400/20">
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Advertencia
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              El navegador está bloqueando el almacenamiento local.
            </p>

            <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-sm leading-6 text-yellow-300">
                Por favor, desactiva el modo InPrivate/Incógnito o
                ajusta la configuración de privacidad de tu navegador.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur-2xl lg:grid-cols-2">

        {/* ============================= */}
        {/* PANEL IZQUIERDO */}
        {/* ============================= */}

        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-10 xl:p-12">

          {/* Decorative circles */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-black/10" />
          <div className="absolute right-10 bottom-10 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative z-10">

            {/* Logo */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
              <Building2 className="h-7 w-7 text-white" />
            </div>

            <h2 className="mt-8 max-w-sm text-4xl font-bold leading-tight tracking-tight text-white">
              Gestiona tu empresa desde un solo lugar.
            </h2>

            <p className="mt-5 max-w-sm text-base leading-7 text-blue-100">
              Accede a tu plataforma ERP y administra las operaciones
              de tu empresa de forma sencilla, segura y eficiente.
            </p>
          </div>

          <div className="relative z-10 space-y-4">

            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>

              <span>Acceso seguro y protegido</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Building2 className="h-5 w-5 text-white" />
              </div>

              <span>Gestión centralizada de tu empresa</span>
            </div>

          </div>
        </div>

        {/* ============================= */}
        {/* PANEL LOGIN */}
        {/* ============================= */}

        <div className="bg-white p-7 sm:p-10 lg:p-12">

          {/* Header */}
          <div className="mb-8">

            {/* Mobile logo */}
            <div className="mb-6 flex lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Plataforma empresarial
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="font-medium">No fue posible iniciar sesión</p>
                <p className="mt-1 leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Correo electrónico
              </label>

              <div className="group relative">

                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>
              </div>

              <div className="group relative">

                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />

                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al sistema</span>

                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Acceso protegido y seguro</span>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <p className="mt-6 text-center text-xs text-slate-500">
        ERP Corporativo · Plataforma de gestión empresarial
      </p>
    </div>
  );
}