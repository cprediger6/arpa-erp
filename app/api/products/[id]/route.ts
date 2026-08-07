// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        category: true,
        subcategory: true,
        variants: true,
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para modificar productos" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el producto
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        description: body.description,
        brand: body.brand,
        model: body.model,
        weight: body.weight,
        unitOfMeasure: body.unitOfMeasure,
        hasIva: body.hasIva,
        images: body.images || [],
        isActive: body.isActive,
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede eliminar productos
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar productos" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    // Verificar que el producto existe y pertenece a la empresa
    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        inventory: true,
        variants: true,
        saleDetails: true,
        purchaseDetails: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene stock
    const totalStock = product.inventory.reduce((sum, item) => sum + item.currentStock, 0);
    
    if (totalStock > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el producto porque tiene stock disponible",
          stock: totalStock,
          suggestion: "Primero debes ajustar el stock a 0 o eliminar el inventario asociado"
        },
        { status: 400 }
      );
    }

    // Verificar si tiene ventas asociadas
    if (product.saleDetails.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el producto porque tiene ventas asociadas",
          sales: product.saleDetails.length
        },
        { status: 400 }
      );
    }

    // Verificar si tiene compras asociadas
    if (product.purchaseDetails.length > 0) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el producto porque tiene compras asociadas",
          purchases: product.purchaseDetails.length
        },
        { status: 400 }
      );
    }

    // ✅ Eliminar el producto con sus relaciones
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar Kardex
      const inventoryItems = await tx.inventoryItem.findMany({
        where: { productId: product.id },
        select: { id: true },
      });
      
      for (const item of inventoryItems) {
        await tx.kardex.deleteMany({
          where: { inventoryItemId: item.id },
        });
      }

      // 2. Eliminar movimientos de inventario
      for (const item of inventoryItems) {
        await tx.inventoryMovement.deleteMany({
          where: { inventoryItemId: item.id },
        });
      }

      // 3. Eliminar items de inventario
      await tx.inventoryItem.deleteMany({
        where: { productId: product.id },
      });

      // 4. Eliminar variantes
      await tx.variant.deleteMany({
        where: { productId: product.id },
      });

      // 5. Eliminar el producto
      await tx.product.delete({
        where: { id: product.id },
      });
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "PRODUCTS",
        recordId: product.id,
        before: product,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Producto eliminado exitosamente" 
    });
  } catch (error: any) {
    console.error("❌ Error al eliminar producto:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar producto" },
      { status: 500 }
    );
  }
}