// app/api/products/route.ts (CORREGIDO)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// Función para generar un ID de producto con el formato correcto
function generateProductId(name: string, companyId: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `product-${cleanName}-${companyId}`;
}

// Función para generar SKU exactamente como en el seed
function generateSKU(): string {
  const timestamp = Date.now();
  return `SKU-product--${timestamp}`;
}

// Función para generar InternalCode exactamente como en el seed
function generateInternalCode(): string {
  const timestamp = Date.now();
  return `INT-product--${timestamp}`;
}

// GET - Obtener productos
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {
      companyId: session.user.companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { internalCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
        variants: true,
        inventory: {
          include: { warehouse: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error en GET /api/products:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST - Crear producto (CORREGIDO - SIN DUPLICADOS)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para crear productos" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { variants, images, image, initialStock = 0, ...productData } = body;

    if (!productData.name) {
      return NextResponse.json(
        { error: "El nombre del producto es requerido" },
        { status: 400 }
      );
    }

    // Generar ID, SKU e InternalCode
    const productId = generateProductId(productData.name, session.user.companyId);
    const sku = generateSKU();
    const internalCode = generateInternalCode();

    // Normalizar imágenes
    let imageArray: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imageArray = images;
    } else if (image && typeof image === 'string' && image.length > 0) {
      imageArray = [image];
    }

    // Verificar si el producto ya existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (existingProduct) {
      return NextResponse.json(
        { 
          error: "Ya existe un producto con este nombre", 
          existingId: productId,
          product: existingProduct 
        },
        { status: 409 }
      );
    }

    // Obtener el primer almacén disponible
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "No hay almacenes disponibles. Crea un almacén primero." },
        { status: 400 }
      );
    }

    // ✅ Crear producto con transacción - SOLO UN REGISTRO DE INVENTARIO
    const product = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto
      const newProduct = await tx.product.create({
        data: {
          id: productId,
          name: productData.name,
          sku: sku,
          internalCode: internalCode,
          barcode: productData.barcode || null,
          description: productData.description || null,
          brand: productData.brand || null,
          model: productData.model || null,
          weight: productData.weight || null,
          unitOfMeasure: productData.unitOfMeasure || "Unidad",
          hasIva: productData.hasIva ?? true,
          images: imageArray,
          isActive: true,
          companyId: session.user.companyId,
          categoryId: productData.categoryId || null,
          subcategoryId: productData.subcategoryId || null,
          variants: {
            create: variants?.map((v: any) => ({
              name: v.name || "Default",
              value: v.value || "Default",
              price: Number(v.price) || 0,
              cost: Number(v.cost) || 0,
              sku: v.sku || `${sku}-${Date.now()}`,
              stock: initialStock,
            })) || [
              {
                name: "Default",
                value: "Default",
                price: Number(productData.price) || 0,
                cost: Number(productData.cost) || 0,
                sku: `${sku}-DEFAULT`,
                stock: initialStock,
              }
            ],
          },
        },
        include: { variants: true },
      });

      // ✅ 2. Crear SOLO UN registro de inventario para la PRIMERA variante
      // No crear inventario con variantId: null
      // Usar la primera variante creada (o la única)
      const firstVariant = newProduct.variants[0];
      
      if (firstVariant) {
        // ✅ Crear UN SOLO registro de inventario asociado a la variante
        const inventoryItem = await tx.inventoryItem.create({
          data: {
            productId: newProduct.id,
            variantId: firstVariant.id, // ✅ Asociado a la variante, no null
            warehouseId: warehouse.id,
            currentStock: initialStock,
            availableStock: initialStock,
            reservedStock: 0,
            transitStock: 0,
            minStock: productData.minStock || 0,
            maxStock: productData.maxStock || 0,
            reorderPoint: productData.reorderPoint || 0,
            costMethod: "FIFO",
            standardCost: firstVariant.cost || 0,
            lastCost: firstVariant.cost || 0,
            averageCost: firstVariant.cost || 0,
          },
        });

        // ✅ Si hay stock inicial, registrar movimiento
        if (initialStock > 0) {
          const movement = await tx.inventoryMovement.create({
            data: {
              type: "ENTRY",
              quantity: initialStock,
              unitCost: firstVariant.cost || 0,
              totalCost: (firstVariant.cost || 0) * initialStock,
              description: `Stock inicial para ${newProduct.name}`,
              inventoryItemId: inventoryItem.id,
              userId: session.user.id,
            },
          });

          await tx.kardex.create({
            data: {
              movementId: movement.id,
              inventoryItemId: inventoryItem.id,
              quantityIn: initialStock,
              quantityOut: 0,
              balance: initialStock,
              unitCost: firstVariant.cost || 0,
              totalCost: (firstVariant.cost || 0) * initialStock,
              balanceCost: (firstVariant.cost || 0) * initialStock,
            },
          });
        }

        console.log(`✅ Inventario creado para variante: ${firstVariant.name} (${firstVariant.value})`);
        console.log(`   ID: ${inventoryItem.id}`);
        console.log(`   Stock: ${inventoryItem.currentStock}`);
      } else {
        console.warn("⚠️ No se crearon variantes para el producto");
      }

      // ✅ Si hay más variantes, crear inventario para cada una
      // (pero ya no se crea el inventario con variantId: null)
      if (newProduct.variants.length > 1) {
        for (let i = 1; i < newProduct.variants.length; i++) {
          const variant = newProduct.variants[i];
          const variantStock = initialStock > 0 ? Math.floor(initialStock / newProduct.variants.length) : 0;
          
          await tx.inventoryItem.create({
            data: {
              productId: newProduct.id,
              variantId: variant.id,
              warehouseId: warehouse.id,
              currentStock: variantStock,
              availableStock: variantStock,
              reservedStock: 0,
              transitStock: 0,
              minStock: 0,
              maxStock: 0,
              reorderPoint: 0,
              costMethod: "FIFO",
              standardCost: variant.cost || 0,
              lastCost: variant.cost || 0,
              averageCost: variant.cost || 0,
            },
          });
        }
      }

      return newProduct;
    });

    console.log(`✅ Producto creado: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   InternalCode: ${product.internalCode}`);
    console.log(`   Variantes: ${product.variants.length}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error en POST /api/products:", error);
    return NextResponse.json(
      { 
        error: "Error al crear producto",
        details: error.message,
      },
      { status: 500 }
    );
  }
}