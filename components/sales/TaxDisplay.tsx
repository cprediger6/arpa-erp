// components/sales/TaxDisplay.tsx
import React from 'react';

interface TaxDisplayProps {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  taxName: string;
  taxRate: number;
  currency?: string;
}

export function TaxDisplay({
  subtotal,
  discount,
  taxAmount,
  total,
  taxName,
  taxRate,
  currency = 'USD'
}: TaxDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal:</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span>Descuento:</span>
          <span className="font-medium">-{formatCurrency(discount)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {taxName} ({taxRate}%):
        </span>
        <span className="font-medium">{formatCurrency(taxAmount)}</span>
      </div>
      
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        * Impuesto {taxName} aplicado al {taxRate}%
      </div>
    </div>
  );
}