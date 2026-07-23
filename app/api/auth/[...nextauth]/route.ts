// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;

// ✅ Log para verificar que la API está cargada
console.log("🔐 Auth API route cargada correctamente");