// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// ✅ Configuración con tus credenciales
cloudinary.config({
  cloud_name: 'innvetario',
  api_key: '833117536278695',
  api_secret: 'tnIyb6njq8LClUzk4XPmXXXXXXX',
  secure: true,
});

export { cloudinary };

// ✅ Subir imagen usando upload_preset sin firma
export async function uploadImageFile(file: File, folder?: string): Promise<string> {
  try {
    console.log('📤 Subiendo imagen a Cloudinary...');
    console.log('Cloud Name:', 'innvetario');

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: folder || 'products',
      upload_preset: 'erp_products', // ⬅️ El preset que creaste
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    console.log('✅ Imagen subida exitosamente:', result.secure_url);
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Error al subir imagen:', {
      message: error.message,
      http_code: error.http_code
    });
    throw error;
  }
}

// ✅ Eliminar imagen
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Imagen eliminada:', publicId);
  } catch (error: any) {
    console.error('❌ Error al eliminar imagen:', error.message);
    throw error;
  }
}

// ✅ Extraer publicId de una URL
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg)/i);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

// ✅ Verificar conexión
export async function testCloudinaryConnection(): Promise<boolean> {
  try {
    const testResult = await cloudinary.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      { 
        folder: 'test',
        public_id: 'test_connection',
        upload_preset: 'erp_products',
      }
    );
    console.log('✅ Conexión a Cloudinary exitosa');
    await cloudinary.uploader.destroy('test/test_connection');
    return true;
  } catch (error: any) {
    console.error('❌ Error al conectar con Cloudinary:', error.message);
    return false;
  }
}