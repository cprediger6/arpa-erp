"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SaleReceiptProps {
  sale: {
    number: string;
    saleDate: string;
    client: { name: string; ruc: string | null; email: string | null; phone: string | null };
    details: { product: { name: string; sku: string }; quantity: number; unitPrice: number; discount: number; total: number }[];
    subtotal: number;
    discount: number;
    tax: number;
    taxName: string;
    taxRate: number;
    total: number;
    payments?: { type: string; amount: number; reference: string | null }[];
    notes: string | null;
  };
  company: {
    name: string;
    ruc: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    currency: string;
  };
}

export function SaleReceipt({ sale, company }: SaleReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprobante ${sale.number}</title>
              <style>
                * {
                  box-sizing: border-box;
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                }
                body {
                  width: 21cm;
                  min-height: 27cm;
                  max-height: 29.7cm;
                  font-size: 13px;
                  padding: 10px;
                  margin: 0 auto;
                }
                .wrapper {
                  border: 1.5px solid #333;
                  padding: 5px;
                  width: 100%;
                }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .italic { font-style: italic; }
                .inline-block { display: inline-block; }
                .flex { display: flex; flex-wrap: wrap; }
                .no-margin { margin: 0; }
                .relative { position: relative; }
                .floating-mid {
                  left: 0;
                  right: 0;
                  margin-left: auto;
                  margin-right: auto;
                  width: 75px;
                  position: absolute;
                  top: 1px;
                  background: #fff;
                }
                .space-around { justify-content: space-around; }
                .space-between { justify-content: space-between; }
                .w50 { width: 50%; }
                th {
                  border: 1px solid #000;
                  background: #eee;
                  padding: 5px;
                  font-size: 11px;
                }
                td {
                  padding: 5px;
                  font-size: 11px;
                  border: 1px solid #000;
                }
                table {
                  border-collapse: collapse;
                  width: 100%;
                }
                .text-20 { font-size: 20px; }
                .footer { margin-top: 20px; }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const paymentMethods: Record<string, string> = {
    CASH: "Efectivo",
    CREDIT_CARD: "Tarjeta de Crédito",
    DEBIT_CARD: "Tarjeta de Débito",
    TRANSFER: "Transferencia Bancaria",
    DIGITAL_WALLET: "Billetera Digital",
  };

  // ✅ Asegurar que payments sea un array
  const payments = sale.payments || [];

  return (
    <div>
      <button
        onClick={handlePrint}
        className="no-print bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir Comprobante
      </button>

      <div className="hidden">
        <div ref={printRef}>
          {/* Encabezado ORIGINAL */}
          <div className="wrapper text-center bold text-20" style={{ borderBottom: '0' }}>
            COMPROBANTE DE PAGO
          </div>

          {/* Datos de la empresa */}
          <div className="flex relative">
            <div className="wrapper inline-block w50 flex" style={{ borderRight: '0' }}>
              <h3 className="text-center" style={{ fontSize: '24px', marginBottom: '3px', width: '100%' }}>
                {company.name.toUpperCase()}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '0', alignSelf: 'flex-end' }}>
                <b>Razón Social:</b> {company.name}
                <br /><b>RUC:</b> {company.ruc}
                <br /><b>Dirección:</b> {company.address}
                <br /><b>Teléfono:</b> {company.phone}
                <br /><b>Email:</b> {company.email}
              </p>
            </div>
            <div className="wrapper inline-block w50">
              <h3 className="text-center" style={{ fontSize: '24px', marginBottom: '3px' }}>COMPROBANTE</h3>
              <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '0' }}>
                <b>N° Comprobante:</b> {sale.number}
                <br /><b>Fecha de Emisión:</b> {format(new Date(sale.saleDate), "dd/MM/yyyy", { locale: es })}
                <br /><b>Hora:</b> {format(new Date(sale.saleDate), "HH:mm", { locale: es })}
                <br /><b>Moneda:</b> {company.currency || "USD"}
              </p>
            </div>
            <div className="wrapper floating-mid">
              <h3 className="no-margin text-center" style={{ fontSize: '36px' }}></h3>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="wrapper" style={{ marginTop: '1px' }}>
            <div className="flex" style={{ marginBottom: '5px' }}>
              <span style={{ width: '50%' }}><b>Cliente:</b> {sale.client.name}</span>
              {sale.client.ruc && <span style={{ width: '50%' }}><b>RUC:</b> {sale.client.ruc}</span>}
            </div>
            <div className="flex">
              {sale.client.email && <span style={{ width: '50%' }}><b>Email:</b> {sale.client.email}</span>}
              {sale.client.phone && <span style={{ width: '50%' }}><b>Teléfono:</b> {sale.client.phone}</span>}
            </div>
          </div>

          {/* Tabla de productos */}
          <table style={{ marginTop: '5px' }}>
            <thead>
              <tr>
                <th className="text-left">Código</th>
                <th className="text-left">Producto / Servicio</th>
                <th className="text-center">Cantidad</th>
                <th className="text-right">Precio Unit.</th>
                <th className="text-right">Descuento</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.details.map((detail, index) => (
                <tr key={index}>
                  <td className="text-left">{detail.product.sku}</td>
                  <td className="text-left">{detail.product.name}</td>
                  <td className="text-center">{detail.quantity}</td>
                  <td className="text-right">${detail.unitPrice.toFixed(2)}</td>
                  <td className="text-right">${detail.discount.toFixed(2)}</td>
                  <td className="text-right">${detail.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div className="flex wrapper space-between" style={{ marginTop: '5px' }}>
            <div style={{ width: '50%' }}>
              {sale.notes && (
                <div>
                  <b>Notas:</b>
                  <p style={{ fontSize: '11px', marginTop: '5px' }}>{sale.notes}</p>
                </div>
              )}
              {payments.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <b>Método de Pago:</b>
                  {payments.map((payment, idx) => (
                    <div key={idx} style={{ fontSize: '11px' }}>
                      {paymentMethods[payment.type] || payment.type}
                      {payment.reference && ` (Ref: ${payment.reference})`}
                      : ${payment.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ width: '45%' }}>
              <div className="flex space-between" style={{ marginBottom: '5px' }}>
                <span><b>Subtotal:</b></span>
                <span>${sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex space-between" style={{ marginBottom: '5px' }}>
                <span><b>Descuento:</b></span>
                <span>-${sale.discount.toFixed(2)}</span>
              </div>
              {sale.tax > 0 && (
                <div className="flex space-between" style={{ marginBottom: '5px' }}>
                  <span><b>{sale.taxName || "IVA"} ({sale.taxRate}%):</b></span>
                  <span>${sale.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex space-between" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #333' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}><b>TOTAL:</b></span>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>${sale.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer" style={{ marginTop: '20px' }}>
            <div className="wrapper text-center" style={{ fontSize: '11px' }}>
              <p>¡Gracias por su compra!</p>
              <p style={{ fontSize: '9px', color: '#666', marginTop: '5px' }}>
                Este comprobante no tiene validez fiscal. Es un documento de control interno.
              </p>
              <p style={{ fontSize: '9px', color: '#666' }}>
                {company.name} - RUC: {company.ruc}
              </p>
              <p style={{ fontSize: '9px', color: '#666' }}>
                Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc' }}>
                <span style={{ fontSize: '9px', color: '#999' }}>
                  Comprobante N°: {sale.number} | Pág 1/1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}