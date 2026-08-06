// lib/auth/helpers.ts 
import { auth } from "@/lib/auth/auth";

export async function getSession() {
  return await auth();
}