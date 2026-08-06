// app/api/settings/update-tax/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCompanyTax, getAvailableCountries } from '@/lib/tax-utils';

export async function POST(request: NextRequest) {
  try {
    const { companyId, country } = await request.json();

    if (!companyId || !country) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Actualizar el impuesto de la empresa
    const result = await updateCompanyTax(companyId, country);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      company: result.company,
      message: `Impuesto actualizado para el país: ${country}`
    });

  } catch (error) {
    console.error('Error al actualizar impuesto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el impuesto' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const countries = await getAvailableCountries();
    return NextResponse.json({ countries });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener países' },
      { status: 500 }
    );
  }
}