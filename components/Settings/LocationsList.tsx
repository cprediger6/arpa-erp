// components/settings/LocationsList.tsx
"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationForm } from "./LocationForm";

interface Location {
  id: string;
  aisle: string;
  shelf: string;
  level: string;
  position: string;
  barcode: string | null;
  _count: {
    inventory: number;
  };
}

interface LocationsListProps {
  warehouseId: string;
  locations: Location[];
  onUpdate: () => void;
}

export function LocationsList({ warehouseId, locations, onUpdate }: LocationsListProps) {
  const { toast } = useToast();
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta ubicación?")) return;

    try {
      const response = await fetch(`/api/settings/locations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Ubicación eliminada correctamente",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la ubicación",
        variant: "destructive",
      });
    }
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-muted-foreground">No hay ubicaciones configuradas</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => {
            setSelectedLocation(null);
            setShowLocationForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ubicación
        </Button>
        {showLocationForm && (
          <LocationForm
            warehouseId={warehouseId}
            onClose={() => setShowLocationForm(false)}
            onSuccess={() => {
              setShowLocationForm(false);
              onUpdate();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {locations.length} ubicación{locations.length > 1 ? "es" : ""}
        </p>
        <Button 
          size="sm" 
          onClick={() => {
            setSelectedLocation(null);
            setShowLocationForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pasillo</TableHead>
            <TableHead>Estante</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Posición</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.aisle}</TableCell>
              <TableCell>{location.shelf}</TableCell>
              <TableCell>{location.level}</TableCell>
              <TableCell>{location.position}</TableCell>
              <TableCell>
                {location.barcode ? (
                  <Badge variant="outline">{location.barcode}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{location._count.inventory}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationForm(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showLocationForm && (
        <LocationForm
          warehouseId={warehouseId}
          location={selectedLocation || undefined}
          onClose={() => {
            setShowLocationForm(false);
            setSelectedLocation(null);
          }}
          onSuccess={() => {
            setShowLocationForm(false);
            setSelectedLocation(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}