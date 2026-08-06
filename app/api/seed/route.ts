// app/api/seed/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado - Inicia sesión primero" },
        { status: 401 }
      );
    }

    // Solo admin puede ejecutar seed
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: `Se requiere rol ADMIN, tu rol es: ${session.user.role}` },
        { status: 403 }
      );
    }

    console.log("🌱 Iniciando seed en producción...");
    console.log("👤 Usuario:", session.user.email);
    console.log("🏢 Empresa:", session.user.companyId);

    // Obtener la empresa
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // 1. Crear bodega
    const warehouse = await prisma.warehouse.upsert({
      where: { id: `warehouse-default-${company.id}` },
      update: {},
      create: {
        id: `warehouse-default-${company.id}`,
        name: 'Bodega Central',
        type: 'CENTRAL',
        address: 'Ciudad de Panamá',
        companyId: company.id
      }
    });

    // 2. Crear categorías
    const categoriesData = [
      { name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
      { name: 'Ropa', description: 'Prendas de vestir y accesorios' },
      { name: 'Alimentos', description: 'Productos alimenticios y bebidas' },
      { name: 'Hogar', description: 'Artículos para el hogar' },
      { name: 'Deportes', description: 'Equipamiento deportivo' },
    ];

    const categories = [];
    for (const cat of categoriesData) {
      const categoryId = `cat-${cat.name.replace(/\s+/g, '-').toLowerCase()}-${company.id}`;
      
      const category = await prisma.category.upsert({
        where: { id: categoryId },
        update: { 
          description: cat.description,
          name: cat.name,
        },
        create: {
          id: categoryId,
          name: cat.name,
          description: cat.description,
          companyId: company.id,
        },
      });
      categories.push(category);
    }

    // Crear mapa de categorías
    const categoryMap: Record<string, string> = {};
    categories.forEach((c) => {
      categoryMap[c.name] = c.id;
    });

    // 3. Crear clientes
    const clientsData = [
      { name: 'Cliente A', email: 'clienteA@test.com', phone: '123456789', address: 'Calle 1, Ciudad de Panamá' },
      { name: 'Cliente B', email: 'clienteB@test.com', phone: '987654321', address: 'Calle 2, Ciudad de Panamá' },
      { name: 'Cliente C', email: 'clienteC@test.com', phone: '555555555', address: 'Calle 3, Ciudad de Panamá' },
      { name: 'Cliente D', email: 'clienteD@test.com', phone: '444444444', address: 'Calle 4, Ciudad de Panamá' },
      { name: 'Cliente E', email: 'clienteE@test.com', phone: '333333333', address: 'Calle 5, Ciudad de Panamá' },
    ];

    const clients = [];
    for (const clientData of clientsData) {
      const existingClient = await prisma.client.findFirst({
        where: { email: clientData.email }
      });

      let client;
      if (existingClient) {
        client = await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            name: clientData.name,
            phone: clientData.phone,
            address: clientData.address,
          },
        });
      } else {
        client = await prisma.client.create({
          data: {
            ...clientData,
            companyId: company.id,
          },
        });
      }
      clients.push(client);
    }

    // 4. Crear productos
    const productsData = [
      { name: 'Laptop HP', price: 1200, stock: 10, category: 'Electrónicos' },
      { name: 'Mouse Logitech', price: 25, stock: 50, category: 'Electrónicos' },
      { name: 'Teclado Mecánico', price: 45, stock: 30, category: 'Electrónicos' },
      { name: 'Monitor 24"', price: 300, stock: 15, category: 'Electrónicos' },
      { name: 'Camisa Polo', price: 30, stock: 100, category: 'Ropa' },
      { name: 'Pantalón Jeans', price: 50, stock: 80, category: 'Ropa' },
      { name: 'Zapatos Deportivos', price: 80, stock: 40, category: 'Ropa' },
      { name: 'Arroz 5kg', price: 10, stock: 200, category: 'Alimentos' },
      { name: 'Aceite 1L', price: 8, stock: 150, category: 'Alimentos' },
      { name: 'Sofá 3 Plazas', price: 500, stock: 10, category: 'Hogar' },
      { name: 'Mesa de Comedor', price: 350, stock: 15, category: 'Hogar' },
      { name: 'Pelota de Fútbol', price: 40, stock: 60, category: 'Deportes' },
    ];

    const products = [];
    for (const pData of productsData) {
      const productId = `prod-${pData.name.replace(/\s+/g, '-').toLowerCase()}-${company.id}`;
      const categoryId = categoryMap[pData.category];
      
      if (!categoryId) {
        console.error(`❌ Categoría no encontrada para: ${pData.category}`);
        continue;
      }

      const product = await prisma.product.upsert({
        where: { id: productId },
        update: {
          categoryId,
          description: pData.name,
        },
        create: {
          id: productId,
          name: pData.name,
          internalCode: `PRD-${pData.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          sku: `SKU-${pData.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          description: pData.name,
          categoryId,
          companyId: company.id,
          unitOfMeasure: 'Unidad',
          hasIva: true,
          isActive: true,
        },
      });

      const variantSku = `SKU-${product.id}-STD`;
      const variant = await prisma.variant.upsert({
        where: { sku: variantSku },
        update: {
          price: pData.price,
          cost: pData.price * 0.6,
          stock: pData.stock,
        },
        create: {
          productId: product.id,
          name: 'Estándar',
          value: 'Único',
          price: pData.price,
          cost: pData.price * 0.6,
          sku: variantSku,
          stock: pData.stock,
        },
      });

      await prisma.inventoryItem.upsert({
        where: {
          id: `inv-${product.id}-${variant.id}-${warehouse.id}`,
        },
        update: {
          currentStock: pData.stock,
          availableStock: pData.stock,
          standardCost: pData.price * 0.6,
          lastCost: pData.price * 0.6,
          averageCost: pData.price * 0.6,
        },
        create: {
          id: `inv-${product.id}-${variant.id}-${warehouse.id}`,
          productId: product.id,
          variantId: variant.id,
          warehouseId: warehouse.id,
          currentStock: pData.stock,
          availableStock: pData.stock,
          reservedStock: 0,
          transitStock: 0,
          minStock: pData.stock * 0.1,
          maxStock: pData.stock * 2,
          reorderPoint: pData.stock * 0.2,
          costMethod: 'FIFO',
          standardCost: pData.price * 0.6,
          lastCost: pData.price * 0.6,
          averageCost: pData.price * 0.6,
        },
      });

      products.push({
        id: product.id,
        variantId: variant.id,
        price: pData.price,
      });
    }

    // 5. Crear ventas de demostración
    const statuses = ['PENDING', 'QUOTE', 'ORDER', 'RESERVED', 'INVOICED', 'DELIVERED', 'COLLECTED'];
    let saleCount = 0;

    for (let i = 0; i < 6; i++) {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - i);
      
      const salesPerMonth = 3 + Math.floor(Math.random() * 4);
      
      for (let j = 0; j < salesPerMonth; j++) {
        if (clients.length === 0 || products.length === 0) break;

        const client = clients[Math.floor(Math.random() * clients.length)];
        const numProducts = 1 + Math.floor(Math.random() * 3);
        const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
        const selectedProducts = shuffledProducts.slice(0, numProducts);
        
        const details = selectedProducts.map(p => {
          const quantity = 1 + Math.floor(Math.random() * 3);
          return {
            productId: p.id,
            variantId: p.variantId,
            quantity: quantity,
            unitPrice: p.price,
            total: p.price * quantity,
            discount: 0,
          };
        });
        
        const subtotal = details.reduce((sum, d) => sum + d.total, 0);
        const taxRate = company.taxRate / 100;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const saleDate = new Date(monthAgo);
        saleDate.setDate(1 + Math.floor(Math.random() * 28));
        saleDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0);
        
        try {
          await prisma.sale.create({
            data: {
              number: `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              companyId: company.id,
              userId: session.user.id,
              clientId: client.id,
              warehouseId: warehouse.id,
              status: status,
              saleDate: saleDate,
              subtotal: subtotal,
              tax: tax,
              taxName: company.taxName || 'ITBMS',
              taxRate: company.taxRate,
              taxAmount: tax,
              total: total,
              currency: 'USD',
              exchangeRate: 1,
              createdAt: saleDate,
              updatedAt: saleDate,
              details: {
                create: details,
              },
            },
          });
          saleCount++;
        } catch (error) {
          console.error('❌ Error al crear venta:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "✅ Datos de prueba creados exitosamente",
      data: {
        categories: categories.length,
        clients: clients.length,
        products: products.length,
        sales: saleCount,
      },
    });

  } catch (error) {
    console.error("❌ Error en seed:", error);
    return NextResponse.json(
      { 
        error: "Error al crear datos: " + (error as Error).message,
        details: (error as Error).stack
      },
      { status: 500 }
    );
  }
}