// app/(dashboard)/companies/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { DataTable } from "@/components/tables/DataTable";
import { Plus, Building, Users, Warehouse } from "lucide-react";

export default function CompaniesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      return response.json();
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsCreating(false);
    },
  });

  const columns = [
    { key: "name", header: "Nombre" },
    { key: "ruc", header: "RUC" },
    { key: "currency", header: "Moneda" },
    { key: "country", header: "País" },
    {
      key: "actions",
      header: "Acciones",
      render: (company: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Building className="h-4 w-4 mr-1" />
            Sucursales
          </Button>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1" />
            Usuarios
          </Button>
          <Button variant="outline" size="sm">
            <Warehouse className="h-4 w-4 mr-1" />
            Almacenes
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Empresas</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={companies || []} 
            columns={columns}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {isCreating && (
        <CompanyForm
          onClose={() => setIsCreating(false)}
          onSubmit={(data) => createCompany.mutate(data)}
        />
      )}
    </div>
  );
}