// lib/validations/index.ts
import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  ruc: z.string().min(1, "El RUC es requerido"),
  address: z.string().optional(),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/Panama"),
  country: z.string().default("Panama"),
  taxRate: z.number().min(0).max(100).default(7),
});

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  cost: z.number().min(0, "El costo debe ser mayor a 0"),
  stock: z.number().min(0, "El stock debe ser mayor o igual a 0"),
  category: z.string().optional(),
  brand: z.string().optional(),
});

export const inventoryMovementSchema = z.object({
  type: z.enum(["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT", "PRODUCTION", "RETURN", "WASTE", "INTERNAL", "LOAN", "DONATION"]),
  quantity: z.number().positive("La cantidad debe ser positiva"),
  unitCost: z.number().min(0, "El costo unitario debe ser mayor a 0"),
  warehouseId: z.string().min(1, "El almacén es requerido"),
  productId: z.string().min(1, "El producto es requerido"),
  description: z.string().optional(),
});

export const userSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  role: z.enum(["ADMIN", "SUPERVISOR", "PURCHASES", "SALES", "WAREHOUSE", "ACCOUNTING", "READ_ONLY"]),
});