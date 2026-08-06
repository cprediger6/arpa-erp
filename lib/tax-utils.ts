// lib/tax-utils.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos
export interface CountryTaxData {
  id: string;
  country: string;
  taxName: string;
  taxRate: number;
  description: string | null;
  isActive: boolean;
}

export interface CompanyTaxUpdate {
  country: string;
  taxRate: number;
  taxName: string;
  countryTaxId: string;
}

/**
 * Obtiene todos los países con sus impuestos
 */
export async function getAllCountryTaxes(): Promise<CountryTaxData[]> {
  try {
    // Usamos queryRaw porque el modelo puede no estar en el cliente aún
    const result = await prisma.$queryRaw`
      SELECT * FROM "CountryTax" 
      WHERE "isActive" = true 
      ORDER BY country ASC;
    `;
    return Array.isArray(result) ? result as CountryTaxData[] : [];
  } catch (error) {
    console.error('Error al obtener impuestos por país:', error);
    return [];
  }
}

/**
 * Obtiene el impuesto de un país específico
 */
export async function getCountryTax(country: string): Promise<CountryTaxData | null> {
  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM "CountryTax" 
      WHERE country = ${country} 
      AND "isActive" = true 
      LIMIT 1;
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      return result[0] as CountryTaxData;
    }
    return null;
  } catch (error) {
    console.error(`Error al obtener impuesto para ${country}:`, error);
    return null;
  }
}

/**
 * Obtiene el impuesto por su ID
 */
export async function getCountryTaxById(id: string): Promise<CountryTaxData | null> {
  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM "CountryTax" 
      WHERE id = ${id} 
      AND "isActive" = true 
      LIMIT 1;
    `;
    
    if (Array.isArray(result) && result.length > 0) {
      return result[0] as CountryTaxData;
    }
    return null;
  } catch (error) {
    console.error(`Error al obtener impuesto por ID ${id}:`, error);
    return null;
  }
}

/**
 * Actualiza los datos de impuestos de una empresa al seleccionar un país
 */
export async function updateCompanyTax(
  companyId: string, 
  country: string
): Promise<{ success: boolean; company?: any; error?: string }> {
  try {
    // Buscar el impuesto del país
    const countryTax = await getCountryTax(country);
    
    if (!countryTax) {
      return {
        success: false,
        error: `No se encontró impuesto para el país: ${country}`
      };
    }

    // Actualizar la empresa
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        country: country,
        taxRate: countryTax.taxRate,
        // @ts-ignore - Estos campos existen en la BD pero no en el tipo de Prisma aún
        taxName: countryTax.taxName,
        // @ts-ignore
        countryTaxId: countryTax.id,
      },
    });

    return {
      success: true,
      company: updatedCompany
    };

  } catch (error) {
    console.error('Error al actualizar impuestos de la empresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene los datos de impuestos de una empresa
 */
export async function getCompanyTaxData(companyId: string): Promise<{
  country: string;
  taxName: string;
  taxRate: number;
  countryTaxId: string | null;
} | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        country: true,
        taxRate: true,
        // @ts-ignore
        taxName: true,
        // @ts-ignore
        countryTaxId: true,
      }
    });

    if (!company) {
      return null;
    }

    // @ts-ignore
    const companyAny = company as any;
    return {
      country: company.country,
      taxName: companyAny.taxName || 'ITBMS',
      taxRate: company.taxRate,
      countryTaxId: companyAny.countryTaxId || null,
    };

  } catch (error) {
    console.error('Error al obtener datos de impuestos de la empresa:', error);
    return null;
  }
}

/**
 * Verifica si un país tiene impuesto configurado
 */
export async function hasCountryTax(country: string): Promise<boolean> {
  try {
    const tax = await getCountryTax(country);
    return !!tax;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene los países disponibles para selección
 */
export async function getAvailableCountries(): Promise<{ 
  value: string; 
  label: string; 
  taxName: string; 
  taxRate: number;
}[]> {
  try {
    const taxes = await getAllCountryTaxes();
    return taxes.map(tax => ({
      value: tax.country,
      label: tax.country,
      taxName: tax.taxName,
      taxRate: tax.taxRate
    }));
  } catch (error) {
    console.error('Error al obtener países disponibles:', error);
    return [];
  }
}

/**
 * Función para sincronizar CountryTax con el seed (ejecutar solo en desarrollo)
 */
export async function syncCountryTaxes() {
  try {
    // Verificar si la tabla existe
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'CountryTax'
      );
    `;
    
    const tableExists = Array.isArray(result) && result.length > 0 && result[0].exists;
    
    if (!tableExists) {
      console.log('⚠️ La tabla CountryTax no existe. Ejecutando seed primero...');
      return false;
    }

    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "CountryTax";
    `;
    
    const total = Array.isArray(count) && count.length > 0 ? Number(count[0].count) : 0;
    
    if (total === 0) {
      console.log('⚠️ No hay datos en CountryTax. Ejecutando seed...');
      return false;
    }
    
    console.log(`✅ CountryTax tiene ${total} registros`);
    return true;
    
  } catch (error) {
    console.error('Error al sincronizar CountryTax:', error);
    return false;
  }
}