// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { uploadImageFile, deleteImage, getPublicIdFromUrl } from "@/lib/cloudinary";

// ✅ POST - Subir imagen
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para subir imágenes" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Formato no soportado. Usa: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5MB" },
        { status: 400 }
      );
    }

    const folder = `companies/${session.user.companyId}/products`;
    const imageUrl = await uploadImageFile(file, folder);

    return NextResponse.json({ 
      url: imageUrl,
      success: true 
    });
  } catch (error: any) {
    console.error("❌ Error al subir imagen:", error.message);
    return NextResponse.json(
      { error: "Error al subir la imagen", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Eliminar imagen
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL de imagen requerida" },
        { status: 400 }
      );
    }

    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      await deleteImage(publicId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error);
    return NextResponse.json(
      { error: "Error al eliminar la imagen" },
      { status: 500 }
    );
  }
}