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
          include: { warehouse: true },
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

// PUT - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { variants: _variants, images, ...productData } = body;

    // Verificar permisos
    const userPermissions = session.user.permissions || [];
    const hasPermission = session.user.role === 'ADMIN' || 
      userPermissions.some((p: any) => p.module === 'PRODUCTS' && p.canEdit);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permisos para editar productos" },
        { status: 403 }
      );
    }

    // Verificar que el producto existe
    const existing = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar producto
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: productData.name,
        sku: productData.sku,
        barcode: productData.barcode || null,
        description: productData.description || null,
        brand: productData.brand || null,
        model: productData.model || null,
        weight: productData.weight || null,
        unitOfMeasure: productData.unitOfMeasure || "Unidad",
        hasIva: productData.hasIva ?? true,
        images: images || [],
        isActive: productData.isActive ?? true,
        categoryId: productData.categoryId || null,
        subcategoryId: productData.subcategoryId || null,
      },
      include: { variants: true },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verificar que el producto existe
    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene inventario
    if (product.inventory.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el producto porque tiene inventario asociado" },
        { status: 400 }
      );
    }

    // Eliminar producto (las variantes se eliminan en cascada) //
    
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}