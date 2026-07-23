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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { variants, images, image, ...productData } = body;

    // Verificar permisos
    const userPermissions = session.user.permissions || [];
    const hasPermission = session.user.role === 'ADMIN' || 
      userPermissions.some((p: any) => p.module === 'PRODUCTS' && p.canCreate);

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permisos para crear productos" },
        { status: 403 }
      );
    }

    // Preparar el array de imágenes
    let imageArray: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imageArray = images;
    } else if (image && typeof image === 'string' && image.length > 0) {
      imageArray = [image];
    }

    // Generar internalCode
    const internalCode = `PROD-${Date.now()}`;

    // Crear el producto
    const product = await prisma.product.create({
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