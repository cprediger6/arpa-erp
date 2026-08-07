// app/api/cloudinary-upload-test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: 'innvetario',
  api_key: '833117536278695',
  api_secret: 'tnIyb6njq8LClUzk4XPmN91AAcg', // ⚠️ Reemplaza con tu secret completo
  secure: true,
});

// POST - Probar subida de imagen
export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar autenticación (opcional, puedes comentar para pruebas)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el archivo del formData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Formato no soportado. Usa: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 5MB" },
        { status: 400 }
      );
    }

    // ✅ Convertir File a base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // ✅ Subir a Cloudinary (sin upload_preset para probar)
    console.log('📤 Subiendo imagen a Cloudinary...');
    console.log('Cloud Name: innvetario');
    console.log('Tamaño:', file.size, 'bytes');
    console.log('Tipo:', file.type);

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'test-uploads',
      public_id: `test_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Imagen subida exitosamente:', result.secure_url);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      message: 'Imagen subida exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al subir imagen:', {
      message: error.message,
      http_code: error.http_code,
    });

    // Mensajes de error más amigables
    let errorMessage = "Error al subir la imagen";
    if (error.message?.includes('Invalid Signature')) {
      errorMessage = "Error de autenticación con Cloudinary. Verifica tu API Key y API Secret.";
    } else if (error.message?.includes('Cloud name')) {
      errorMessage = "Error de configuración. Verifica el cloud_name.";
    } else if (error.http_code === 401) {
      errorMessage = "Credenciales inválidas. Verifica tu API Key y API Secret.";
    } else if (error.http_code === 404) {
      errorMessage = "Cloudinary no encontrado. Verifica tu cloud_name.";
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        http_code: error.http_code,
        suggestion: 'Verifica que las credenciales de Cloudinary sean correctas'
      },
      { status: 500 }
    );
  }
}

// GET - Probar configuración (sin subir imagen)
export async function GET() {
  try {
    // ✅ Verificar que las credenciales son válidas
    const result = await cloudinary.api.ping();
    
    return NextResponse.json({
      success: true,
      message: '✅ Credenciales de Cloudinary válidas',
      status: result.status,
      config: {
        cloud_name: 'innvetario',
        api_key: '833117536278695',
        api_secret: '****' + process.env.CLOUDINARY_API_SECRET?.slice(-4) || 'no configurado',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      http_code: error.http_code,
      suggestion: error.http_code === 401 ? 'Credenciales inválidas. Verifica API Key y Secret.' :
                  error.http_code === 404 ? 'Cloud name incorrecto. Verifica cloud_name.' :
                  'Error desconocido. Verifica tu conexión.',
    }, { status: 500 });
  }
}