// lib/sales/tax-service.ts
import { PrismaClient } from '@prisma/client';
import { getCompanyTaxData } from '../tax-utils';

const prisma = new PrismaClient();

export interface TaxCalculationResult {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  taxName: string;
  taxRate: number;
}

export async function calculateSaleTax(
  companyId: string,
  subtotal: number,
  discount: number = 0,
  taxRate?: number
): Promise<TaxCalculationResult> {
  try {
    const companyTax = await getCompanyTaxData(companyId);
    const rate = taxRate || companyTax?.taxRate || 0;
    const taxName = companyTax?.taxName || 'IVA';
    
    const subtotalAfterDiscount = subtotal - discount;
    const taxAmount = (subtotalAfterDiscount * rate) / 100;
    const total = subtotalAfterDiscount + taxAmount;
    
    return {
      subtotal,
      discount,
      taxAmount,
      total,
      taxName,
      taxRate: rate
    };
  } catch (error) {
    console.error('Error al calcular impuestos:', error);
    return {
      subtotal,
      discount,
      taxAmount: 0,
      total: subtotal - discount,
      taxName: 'Sin impuesto',
      taxRate: 0
    };
  }
}

export async function createSaleWithTax(
  data: {
    clientId: string;
    userId: string;
    companyId: string;
    warehouseId?: string;
    saleDate?: Date;
    deliveryDate?: Date;
    currency?: string;
    exchangeRate?: number;
    notes?: string;
    details: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>;
  }
) {
  try {
    console.log('🔄 Creando venta con datos:', data);

    // Validar datos
    if (!data.clientId || !data.userId || !data.companyId) {
      throw new Error('Faltan datos requeridos: clientId, userId, companyId');
    }

    if (!data.details || data.details.length === 0) {
      throw new Error('No hay productos en la venta');
    }

    // Obtener datos de impuestos
    const companyTax = await getCompanyTaxData(data.companyId);
    console.log('📊 Datos de impuestos:', companyTax);
    
    // Calcular subtotal
    let subtotal = 0;
    const detailsWithTotal = data.details.map(detail => {
      const total = detail.quantity * detail.unitPrice;
      const discount = detail.discount || 0;
      const subtotalItem = total - discount;
      subtotal += subtotalItem;
      
      return {
        ...detail,
        total: subtotalItem,
        discount: discount
      };
    });
    
    console.log('💰 Subtotal calculado:', subtotal);
    
    // Calcular impuestos
    const taxResult = await calculateSaleTax(
      data.companyId,
      subtotal,
      0,
      companyTax?.taxRate
    );
    
    console.log('🧾 Resultado impuestos:', taxResult);

    // Generar número de venta
    const saleNumber = await generateSaleNumber();
    console.log('📝 Número de venta:', saleNumber);

    // Crear la venta
    const sale = await prisma.sale.create({
      data: {
        number: saleNumber,
        clientId: data.clientId,
        userId: data.userId,
        companyId: data.companyId,
        warehouseId: data.warehouseId,
        saleDate: data.saleDate || new Date(),
        deliveryDate: data.deliveryDate,
        currency: data.currency || 'USD',
        exchangeRate: data.exchangeRate || 1,
        notes: data.notes,
        subtotal: taxResult.subtotal,
        discount: taxResult.discount,
        tax: taxResult.taxAmount,
        taxName: taxResult.taxName,
        taxRate: taxResult.taxRate,
        taxAmount: taxResult.taxAmount,
        total: taxResult.total,
        status: 'PENDING',
        details: {
          create: detailsWithTotal.map(detail => ({
            productId: detail.productId,
            variantId: detail.variantId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            discount: detail.discount || 0,
            total: detail.total
          }))
        }
      },
      include: {
        details: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              }
            },
            variant: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    console.log('✅ Venta creada exitosamente:', sale.id);
    
    return {
      success: true,
      sale,
      taxBreakdown: {
        taxName: taxResult.taxName,
        taxRate: taxResult.taxRate,
        taxAmount: taxResult.taxAmount,
        subtotal: taxResult.subtotal,
        total: taxResult.total
      }
    };
  } catch (error) {
    console.error('❌ Error al crear venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

async function generateSaleNumber(): Promise<string> {
  try {
    const lastSale = await prisma.sale.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true }
    });
    
    if (!lastSale) {
      return 'SALE-0001';
    }
    
    const numberMatch = lastSale.number.match(/\d+$/);
    if (!numberMatch) {
      return 'SALE-0001';
    }
    
    const lastNumber = parseInt(numberMatch[0]);
    const newNumber = String(lastNumber + 1).padStart(4, '0');
    return `SALE-${newNumber}`;
  } catch (error) {
    console.error('Error generando número de venta:', error);
    return `SALE-${Date.now().toString().slice(-4)}`;
  }
}