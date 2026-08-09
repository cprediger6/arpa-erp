// components/Settings/LocationForm.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  aisle: string;
  shelf: string;
  level: string;
  position: string;
  barcode: string | null;
}

interface LocationFormProps {
  warehouseId: string;
  location?: Location;
  onClose: () => void;
  onSuccess: () => void;
}

export function LocationForm({ warehouseId, location, onClose, onSuccess }: LocationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    aisle: location?.aisle || "",
    shelf: location?.shelf || "",
    level: location?.level || "",
    position: location?.position || "",
    barcode: location?.barcode || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = location 
        ? `/api/settings/locations/${location.id}`
        : "/api/settings/locations";
      
      const method = location ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, warehouseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: `Ubicación ${location ? "actualizada" : "creada"} correctamente`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la ubicación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{location ? "Editar" : "Nueva"} Ubicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aisle">Pasillo *</Label>
              <Input
                id="aisle"
                placeholder="A-01"
                value={formData.aisle}
                onChange={(e) => handleChange("aisle", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shelf">Estante *</Label>
              <Input
                id="shelf"
                placeholder="S-02"
                value={formData.shelf}
                onChange={(e) => handleChange("shelf", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel *</Label>
              <Input
                id="level"
                placeholder="L-03"
                value={formData.level}
                onChange={(e) => handleChange("level", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Posición *</Label>
              <Input
                id="position"
                placeholder="P-04"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras (opcional)</Label>
            <Input
              id="barcode"
              placeholder="LOC-001"
              value={formData.barcode}
              onChange={(e) => handleChange("barcode", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}