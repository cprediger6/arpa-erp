// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    const products = await prisma.product.findMany({
      where: {
        companyId: session.user.companyId,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
        variants: true,
        inventory: {
          include: { warehouse: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
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

// app/api/products/route.ts - Sección POST actualizada

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para crear productos. Solo ADMIN, SUPERVISOR y WAREHOUSE pueden hacerlo." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { variants, images, image, initialStock = 0, ...productData } = body; // ✅ Agregar campo initialStock

    let imageArray: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imageArray = images;
    } else if (image && typeof image === 'string' && image.length > 0) {
      imageArray = [image];
    }

    const internalCode = `PROD-${Date.now()}`;

    // ✅ Obtener el primer almacén disponible
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "No hay almacenes disponibles. Crea un almacén primero en Configuración." },
        { status: 400 }
      );
    }

    // ✅ Crear producto con transacción para incluir inventario y stock inicial
    const product = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto
      const newProduct = await tx.product.create({
        data: {
          name: productData.name,
          sku: productData.sku,
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
              sku: v.sku || `${productData.sku}-${Date.now()}`,
              stock: 0,
            })) || [],
          },
        },
        include: { variants: true },
      });

      // 2. ✅ Crear inventario principal con stock inicial
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          productId: newProduct.id,
          variantId: null,
          warehouseId: warehouse.id,
          currentStock: initialStock,
          availableStock: initialStock,
          reservedStock: 0,
          transitStock: 0,
          costMethod: "AVERAGE",
          lastCost: productData.cost || 0,
        },
      });

      // 3. ✅ Si tiene variantes, crear inventario para cada variante
      if (newProduct.variants && newProduct.variants.length > 0) {
        for (const variant of newProduct.variants) {
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
              costMethod: "AVERAGE",
              lastCost: variant.cost || 0,
            },
          });
        }
      }

      // 4. ✅ Si hay stock inicial, registrar movimiento de entrada
      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            type: "ENTRY",
            quantity: initialStock,
            unitCost: productData.cost || 0,
            totalCost: (productData.cost || 0) * initialStock,
            description: `Stock inicial para ${newProduct.name}`,
            inventoryItemId: inventoryItem.id,
            userId: session.user.id,
          },
        });

        // Registrar en Kardex
        const movement = await tx.inventoryMovement.findFirst({
          where: {
            inventoryItemId: inventoryItem.id,
            description: `Stock inicial para ${newProduct.name}`,
          },
          orderBy: { createdAt: "desc" },
        });

        if (movement) {
          await tx.kardex.create({
            data: {
              movementId: movement.id,
              inventoryItemId: inventoryItem.id,
              quantityIn: initialStock,
              quantityOut: 0,
              balance: initialStock,
              unitCost: productData.cost || 0,
              totalCost: (productData.cost || 0) * initialStock,
              balanceCost: (productData.cost || 0) * initialStock,
            },
          });
        }
      }

      return newProduct;
    });

    // Registrar auditoría
    try {
      await prisma.audit.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          module: "PRODUCTS",
          recordId: product.id,
          after: product,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    } catch (auditError) {
      console.warn("⚠️ Error al registrar auditoría:", auditError);
    }

    console.log(`✅ Producto creado con ${initialStock} unidades de stock inicial: ${product.name}`);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error en POST /api/products:");
    console.error("Mensaje:", error.message);
    
    return NextResponse.json(
      { 
        error: "Error al crear producto",
        details: error.message,
      },
      { status: 500 }
    );
  }
}