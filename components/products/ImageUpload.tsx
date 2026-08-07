// components/products/ImageUpload.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ 
  onImagesChange, 
  initialImages = [], 
  maxImages = 5,
  className 
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error al subir imagen");
        }

        const data = await res.json();
        const newImages = [...images, data.url];
        setImages(newImages);
        onImagesChange(newImages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
      console.error("Error uploading:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index];
    
    try {
      // Eliminar de Cloudinary
      await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
    }

    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir Imagen
            </>
          )}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} imágenes
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50">
                <Image
                  src={url}
                  alt={`Producto imagen ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formatos soportados: JPG, PNG, WebP, GIF. Máximo 5MB por imagen.
      </p>
    </div>
  );
}