// app/api/cloudinary-upload-test/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ ACTUALIZADO CON EL CLOUD_NAME CORRECTO
const CLOUD_NAME = 'zmop9hty'; // ⬅️ Este es el cloud_name real
// Estos valores deben venir de tu cuenta, pero mantenemos los que tienes
const API_KEY = '443936558629452';
const API_SECRET = 'fw7mDDM7pM4PhHNGc4PxMAjQk5s';

console.log('🔍 Configurando Cloudinary...');
console.log('Cloud Name:', CLOUD_NAME);
console.log('API Key:', API_KEY);
console.log('API Secret:', API_SECRET ? '✅ Configurado' : '❌ No configurado');

// ✅ GET - Estado de la API
export async function GET() {
  return NextResponse.json({
    success: true,
    message: '✅ API de Cloudinary funcionando',
    timestamp: new Date().toISOString(),
    cloud_name: CLOUD_NAME,
    endpoints: {
      upload: 'POST /api/cloudinary-upload-test',
      status: 'GET /api/cloudinary-upload-test',
    }
  });
}

// ✅ POST - Subir imagen usando upload_preset
export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST recibido - Cloudinary con upload_preset');
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    console.log('📄 Archivo:', file.name, file.type, file.size);

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

    // ✅ Subir directamente a Cloudinary usando upload_preset
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', 'erp_products');
    uploadFormData.append('folder', 'test-uploads');

    console.log('📤 Subiendo a Cloudinary con upload_preset...');
    console.log('🌐 URL:', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    console.log('📦 Upload Preset:', 'erp_products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const responseText = await response.text();
    console.log('📥 Respuesta completa:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: { message: responseText } };
      }
      console.error('❌ Error de Cloudinary:', errorData);
      
      let errorMessage = 'Error al subir imagen';
      if (errorData.error?.message?.includes('preset')) {
        errorMessage = '⚠️ El upload_preset "erp_products" no existe. Crealo en Cloudinary Dashboard → Settings → Upload → Upload Presets → Add upload preset (Unsigned)';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Imagen subida:', data.secure_url);

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      public_id: data.public_id,
      message: 'Imagen subida exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error en POST:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error al subir la imagen',
        suggestion: 'Verifica que el upload_preset "erp_products" exista y esté configurado como "Unsigned"'
      },
      { status: 500 }
    );
  }
}