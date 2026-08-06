// components/sales/SaleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { TaxDisplay } from './TaxDisplay';

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface SaleFormProps {
  companyId: string;
  userId: string;
}

export function SaleForm({ companyId, userId }: SaleFormProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount] = useState(0);
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [taxCalculation, setTaxCalculation] = useState<{
    taxName: string;
    taxRate: number;
    taxAmount: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Array<{id: string, name: string, price: number}>>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Cargar clientes y productos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar clientes
        const clientsRes = await fetch(`/api/clients?companyId=${companyId}`);
        const clientsData = await clientsRes.json();
        if (clientsData.success) {
          setClients(clientsData.clients);
        }

        // Cargar productos
        const productsRes = await fetch(`/api/products?companyId=${companyId}`);
        const productsData = await productsRes.json();
        if (productsData.success) {
          setProducts(productsData.products);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  // Calcular impuestos
  useEffect(() => {
    const calculateTax = async () => {
      if (subtotal > 0 && companyId) {
        try {
          const response = await fetch('/api/sales/calculate-tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, subtotal, discount }),
          });
          const result = await response.json();
          if (result.success) {
            setTaxCalculation({
              taxName: result.taxName,
              taxRate: result.taxRate,
              taxAmount: result.taxAmount,
              total: result.total
            });
          }
        } catch (error) {
          console.error('Error calculando impuestos:', error);
        }
      }
    };
    
    calculateTax();
  }, [subtotal, discount, companyId]);

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) {
      setError('Selecciona un producto y cantidad válida');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setError('Producto no encontrado');
      return;
    }

    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      discount: 0,
      subtotal: quantity * product.price
    };
    
    const newItems = [...items, newItem];
    setItems(newItems);
    const newSubtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    setSubtotal(newSubtotal);
    setError(null);
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const newSubtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    setSubtotal(newSubtotal);
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validaciones
    if (!clientId) {
      setError('Por favor selecciona un cliente');
      return;
    }
    
    if (items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setLoading(true);
    
    try {
      const saleData = {
        clientId,
        userId,
        companyId,
        details: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0
        })),
        notes: '',
      };

      console.log('📤 Enviando datos:', saleData);

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();
      console.log('📥 Respuesta:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la venta');
      }

      if (result.success) {
        alert(`✅ Venta creada exitosamente!\n${result.taxBreakdown?.taxName || 'IVA'}: ${result.taxBreakdown?.taxRate || 0}%\nTotal: $${result.taxBreakdown?.total?.toFixed(2) || '0.00'}`);
        // Resetear formulario
        setItems([]);
        setSubtotal(0);
        setClientId('');
        setTaxCalculation(null);
      } else {
        throw new Error(result.error || 'Error al crear la venta');
      }

    } catch (error) {
      console.error('❌ Error al crear venta:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Seleccionar Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Seleccionar cliente...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Agregar Producto */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Producto</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccionar producto...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={addItem}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Lista de items */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">{item.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">${item.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">${item.subtotal.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No hay productos agregados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de impuestos */}
      {taxCalculation && (
        <TaxDisplay
          subtotal={subtotal}
          discount={discount}
          taxAmount={taxCalculation.taxAmount}
          total={taxCalculation.total}
          taxName={taxCalculation.taxName}
          taxRate={taxCalculation.taxRate}
        />
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSubmit}
          disabled={loading || items.length === 0 || !clientId}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Venta'}
        </button>
      </div>
    </div>
  );
}