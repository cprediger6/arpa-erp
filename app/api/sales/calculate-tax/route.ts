// app/api/sales/calculate-tax/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCompanyTaxData } from '@/lib/tax-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, subtotal, discount = 0 } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos de impuestos de la empresa
    const companyTax = await getCompanyTaxData(companyId);
    
    const taxRate = companyTax?.taxRate || 0;
    const taxName = companyTax?.taxName || 'IVA';
    
    // Calcular impuestos
    const subtotalAfterDiscount = subtotal - discount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const total = subtotalAfterDiscount + taxAmount;

    return NextResponse.json({
      success: true,
      taxName,
      taxRate,
      taxAmount,
      total,
      subtotal: subtotalAfterDiscount
    });

  } catch (error) {
    console.error('Error calculando impuestos:', error);
    return NextResponse.json(
      { error: 'Error al calcular impuestos' },
      { status: 500 }
    );
  }
}