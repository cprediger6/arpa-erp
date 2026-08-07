// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Datos de impuestos por país
const countryTaxes = [
  { country: 'Argentina', taxName: 'IVA', taxRate: 21, description: 'Impuesto al Valor Agregado' },
  { country: 'Bolivia', taxName: 'IVA', taxRate: 13, description: 'Impuesto al Valor Agregado' },
  { country: 'Brasil', taxName: 'IBS/CBS', taxRate: 27, description: 'Impuesto sobre Bienes y Servicios' },
  { country: 'Chile', taxName: 'IVA', taxRate: 19, description: 'Impuesto al Valor Agregado' },
  { country: 'Colombia', taxName: 'IVA', taxRate: 19, description: 'Impuesto al Valor Agregado' },
  { country: 'Costa Rica', taxName: 'IVA', taxRate: 13, description: 'Impuesto sobre el Valor Agregado' },
  { country: 'Ecuador', taxName: 'IVA', taxRate: 15, description: 'Impuesto al Valor Agregado' },
  { country: 'El Salvador', taxName: 'IVA', taxRate: 13, description: 'Impuesto al Valor Agregado' },
  { country: 'Guatemala', taxName: 'IVA', taxRate: 12, description: 'Impuesto al Valor Agregado' },
  { country: 'México', taxName: 'IVA', taxRate: 16, description: 'Impuesto al Valor Agregado' },
  { country: 'Nicaragua', taxName: 'IVA', taxRate: 15, description: 'Impuesto al Valor Agregado' },
  { country: 'Panamá', taxName: 'ITBMS', taxRate: 7, description: 'Impuesto a la Transferencia de Bienes Corporales Muebles y Prestación de Servicios' },
  { country: 'Paraguay', taxName: 'IVA', taxRate: 10, description: 'Impuesto al Valor Agregado' },
  { country: 'Perú', taxName: 'IGV', taxRate: 18, description: 'Impuesto General a las Ventas' },
  { country: 'Rep. Dominicana', taxName: 'ITBIS', taxRate: 18, description: 'Impuesto sobre Transferencias de Bienes Industrializados y Servicios' },
  { country: 'Uruguay', taxName: 'IVA', taxRate: 22, description: 'Impuesto al Valor Agregado' },
  { country: 'Venezuela', taxName: 'IVA', taxRate: 16, description: 'Impuesto al Valor Agregado' },
];

// Monedas existentes
const currencies = [
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'HTG', name: 'Gourde haitiano', symbol: 'G', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'XCD', name: 'Dólar del Caribe Oriental', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'NIO', name: 'Córdoba nicaragüense', symbol: 'C$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', decimalPlaces: 0, isBase: false, isActive: true },
  { code: 'CAD', name: 'Dólar canadiense', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', decimalPlaces: 2, isBase: true, isActive: true },
  { code: 'CUP', name: 'Peso cubano', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'JMD', name: 'Dólar jamaiquino', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'GTQ', name: 'Quetzal', symbol: 'Q', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'TTD', name: 'Dólar de Trinidad y Tobago', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'HNL', name: 'Lempira', symbol: 'L', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'BZD', name: 'Dólar beliceño', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', decimalPlaces: 0, isBase: false, isActive: true },
  { code: 'PAB', name: 'Balboa panameño', symbol: 'B/.', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'SRD', name: 'Dólar surinamés', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'BSD', name: 'Dólar bahameño', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'BBD', name: 'Dólar de Barbados', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'CRC', name: 'Colón costarricense', symbol: '₡', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'PYG', name: 'Guaraní', symbol: '₲', decimalPlaces: 0, isBase: false, isActive: true },
  { code: 'VES', name: 'Bolívar', symbol: 'Bs.', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'GYD', name: 'Dólar guyanés', symbol: '$', decimalPlaces: 2, isBase: false, isActive: true },
  { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', decimalPlaces: 2, isBase: false, isActive: true },
];

// Usuarios
const users = [
  { email: 'admin@empresa.com', name: 'Admin', lastName: 'Sistema', role: 'ADMIN' },
  { email: 'ventas@empresa.com', name: 'Usuario', lastName: 'Ventas', role: 'SALES' },
  { email: 'compras@empresa.com', name: 'Usuario', lastName: 'Compras', role: 'PURCHASES' },
  { email: 'bodega@empresa.com', name: 'Usuario', lastName: 'Bodega', role: 'WAREHOUSE' },
  { email: 'contabilidad@empresa.com', name: 'Usuario', lastName: 'Contabilidad', role: 'ACCOUNTING' },
  { email: 'supervisor@empresa.com', name: 'Usuario', lastName: 'Supervisor', role: 'SUPERVISOR' },
  { email: 'consulta@empresa.com', name: 'Usuario', lastName: 'Consulta', role: 'READ_ONLY' },
];

// Función para generar SKU único
function generateUniqueSKU(prefix: string, productId: string, timestamp: number): string {
  return `${prefix}-${productId.substring(0, 8)}-${timestamp}`;
}

// ✅ Función para limpiar inventario duplicado de un producto
async function cleanDuplicateInventory(productId: string) {
  // Obtener todos los items de inventario del producto
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { productId },
    include: { variant: true },
  });

  if (inventoryItems.length <= 1) {
    return inventoryItems;
  }

  console.log(`  🧹 Limpiando ${inventoryItems.length} items de inventario para producto ${productId}`);

  // Agrupar por variantId (incluyendo null)
  const grouped = inventoryItems.reduce((acc, item) => {
    const key = item.variantId || 'null';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof inventoryItems>);

  const itemsToKeep = [];

  for (const [variantKey, items] of Object.entries(grouped)) {
    if (items.length <= 1) {
      itemsToKeep.push(items[0]);
      continue;
    }

    // Ordenar por stock (mantener el que tiene más stock)
    const sorted = items.sort((a, b) => b.currentStock - a.currentStock);
    const keep = sorted[0];
    const remove = sorted.slice(1);

    console.log(`    Variante ${variantKey}: manteniendo item ${keep.id} (stock: ${keep.currentStock})`);

    for (const item of remove) {
      console.log(`    🗑️ Eliminando item duplicado ${item.id} (stock: ${item.currentStock})`);
      
      // Eliminar Kardex asociados
      await prisma.kardex.deleteMany({
        where: { inventoryItemId: item.id },
      });

      // Eliminar movimientos asociados
      await prisma.inventoryMovement.deleteMany({
        where: { inventoryItemId: item.id },
      });

      // Eliminar el item
      await prisma.inventoryItem.delete({
        where: { id: item.id },
      });
    }

    itemsToKeep.push(keep);
  }

  return itemsToKeep;
}

// ✅ Función para obtener o crear la variante estándar de un producto
async function getOrCreateStandardVariant(productId: string, price: number, cost: number, stock: number) {
  // Buscar una variante existente con nombre 'Estándar'
  let variant = await prisma.variant.findFirst({
    where: {
      productId: productId,
      name: 'Estándar',
    },
  });

  if (!variant) {
    // Si no existe, crear una nueva
    const timestamp = Date.now();
    const sku = `SKU-${productId.substring(0, 8)}-${timestamp}`;
    
    variant = await prisma.variant.create({
      data: {
        productId: productId,
        name: 'Estándar',
        value: 'Único',
        price: price,
        cost: cost,
        sku: sku,
        stock: stock,
      },
    });
    console.log(`  ✅ Variante estándar creada para producto ${productId}`);
  } else {
    // Actualizar la variante existente
    variant = await prisma.variant.update({
      where: { id: variant.id },
      data: {
        price: price,
        cost: cost,
        stock: stock,
      },
    });
    console.log(`  ✅ Variante estándar actualizada para producto ${productId}`);
  }

  return variant;
}

// ✅ Función para crear o actualizar un producto completo
async function createOrUpdateProduct(
  productData: { name: string; price: number; stock: number; category: string },
  categoryId: string,
  companyId: string,
  warehouseId: string
) {
  const productId = `product-${productData.name.replace(/\s+/g, '-').toLowerCase()}-${companyId}`;
  
  // 1. Crear o actualizar el producto
  let product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const timestamp = Date.now();
    const sku = generateUniqueSKU('SKU', productId, timestamp);
    const internalCode = generateUniqueSKU('INT', productId, timestamp);
    
    product = await prisma.product.create({
      data: {
        id: productId,
        name: productData.name,
        internalCode: internalCode,
        sku: sku,
        description: productData.name,
        categoryId,
        companyId: companyId,
        unitOfMeasure: 'Unidad',
        hasIva: true,
        isActive: true,
      },
    });
    console.log(`  ✅ Producto creado: ${productData.name}`);
  } else {
    product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: productData.name,
        description: productData.name,
        categoryId,
        isActive: true,
      },
    });
    console.log(`  ✅ Producto actualizado: ${productData.name}`);
  }

  // 2. Limpiar inventario duplicado
  await cleanDuplicateInventory(product.id);

  // 3. Crear o actualizar la variante estándar
  const variant = await getOrCreateStandardVariant(
    product.id,
    productData.price,
    productData.price * 0.6,
    productData.stock
  );

  // 4. Crear o actualizar el inventario
  const existingInventory = await prisma.inventoryItem.findFirst({
    where: {
      productId: product.id,
      variantId: variant.id,
      warehouseId: warehouseId,
    },
  });

  if (existingInventory) {
    await prisma.inventoryItem.update({
      where: { id: existingInventory.id },
      data: {
        currentStock: productData.stock,
        availableStock: productData.stock,
        standardCost: productData.price * 0.6,
        lastCost: productData.price * 0.6,
        averageCost: productData.price * 0.6,
      },
    });
    console.log(`  ✅ Inventario actualizado para: ${productData.name}`);
  } else {
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        variantId: variant.id,
        warehouseId: warehouseId,
        currentStock: productData.stock,
        availableStock: productData.stock,
        reservedStock: 0,
        transitStock: 0,
        minStock: productData.stock * 0.1,
        maxStock: productData.stock * 2,
        reorderPoint: productData.stock * 0.2,
        costMethod: 'FIFO',
        standardCost: productData.price * 0.6,
        lastCost: productData.price * 0.6,
        averageCost: productData.price * 0.6,
      },
    });
    console.log(`  ✅ Inventario creado para: ${productData.name}`);
  }

  return {
    id: product.id,
    variantId: variant.id,
    price: productData.price,
  };
}

async function main() {
  console.log('🌱 Iniciando seed...');

  try {
    // 1. Crear la tabla CountryTax si no existe
    console.log('🔧 Verificando/Creando tabla CountryTax...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CountryTax" (
        "id" TEXT NOT NULL,
        "country" TEXT NOT NULL,
        "taxName" TEXT NOT NULL,
        "taxRate" DOUBLE PRECISION NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CountryTax_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "CountryTax_country_key" ON "CountryTax"("country");
    `;

    console.log('✅ Tabla CountryTax verificada/creada');

    // 2. Insertar o actualizar impuestos usando SQL directo
    console.log('💸 Insertando impuestos por país...');
    let taxCount = 0;
    
    for (const tax of countryTaxes) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "CountryTax" ("id", "country", "taxName", "taxRate", "description", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${tax.country}, ${tax.taxName}, ${tax.taxRate}, ${tax.description}, true, NOW(), NOW())
          ON CONFLICT ("country") 
          DO UPDATE SET 
            "taxName" = EXCLUDED."taxName",
            "taxRate" = EXCLUDED."taxRate",
            "description" = EXCLUDED."description",
            "isActive" = true,
            "updatedAt" = NOW();
        `;
        taxCount++;
      } catch (error) {
        console.error(`❌ Error al insertar impuesto para ${tax.country}:`, error);
      }
    }
    console.log(`✅ ${taxCount} impuestos por país insertados`);

    // 3. Obtener el impuesto de Panamá
    const defaultCountry = 'Panamá';
    const result: any[] = await prisma.$queryRaw`
      SELECT * FROM "CountryTax" WHERE country = ${defaultCountry} LIMIT 1;
    `;
    
    const defaultTax = Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (!defaultTax) {
      throw new Error(`No se encontró el impuesto para ${defaultCountry}`);
    }

    // 4. Crear empresa por defecto
    console.log('📦 Creando empresa demo...');
    const company = await prisma.company.upsert({
      where: { ruc: '123456789' },
      update: {
        name: 'Empresa Demo',
        address: 'Ciudad de Panamá',
        currency: 'USD',
        timezone: 'America/Panama',
        country: 'Panamá',
        taxRate: defaultTax.taxRate,
        taxName: defaultTax.taxName,
        countryTaxId: defaultTax.id,
      },
      create: {
        name: 'Empresa Demo',
        ruc: '123456789',
        address: 'Ciudad de Panamá',
        currency: 'USD',
        timezone: 'America/Panama',
        country: 'Panamá',
        taxRate: defaultTax.taxRate,
        taxName: defaultTax.taxName,
        countryTaxId: defaultTax.id,
      },
    });
    
    console.log(`✅ Empresa creada con impuesto ${defaultTax.taxName} (${defaultTax.taxRate}%)`);

    // 5. Crear bodega por defecto
    console.log('🏭 Creando bodega central...');
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
    console.log('✅ Bodega central creada');

    // 6. Crear usuarios
    console.log('👤 Creando usuarios con diferentes roles...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    let userCount = 0;

    for (const userData of users) {
      try {
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            password: hashedPassword,
            name: userData.name,
            lastName: userData.lastName,
            role: userData.role,
            isActive: true,
            companyId: company.id,
          },
          create: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            lastName: userData.lastName,
            role: userData.role,
            companyId: company.id,
            isActive: true,
          },
        });
        userCount++;
        console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Error al crear usuario ${userData.email}:`, error);
      }
    }
    console.log(`✅ ${userCount} usuarios creados`);

    // 7. Crear categorías
    console.log('📂 Creando categorías...');
    const categories = [
      { name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
      { name: 'Ropa', description: 'Prendas de vestir y accesorios' },
      { name: 'Alimentos', description: 'Productos alimenticios y bebidas' },
      { name: 'Hogar', description: 'Artículos para el hogar' },
      { name: 'Deportes', description: 'Equipamiento deportivo' },
    ];

    const categoryMap: { [key: string]: string } = {};

    for (const cat of categories) {
      try {
        const category = await prisma.category.upsert({
          where: { 
            id: `category-${cat.name}-${company.id}` 
          },
          update: { 
            description: cat.description 
          },
          create: {
            id: `category-${cat.name}-${company.id}`,
            name: cat.name,
            description: cat.description,
            companyId: company.id,
          },
        });
        categoryMap[cat.name] = category.id;
      } catch (error) {
        console.error(`❌ Error al crear categoría ${cat.name}:`, error);
      }
    }
    console.log(`✅ ${categories.length} categorías creadas`);

    // 8. Insertar monedas
    console.log('💰 Insertando monedas...');
    let insertedCount = 0;
    for (const currency of currencies) {
      try {
        await prisma.currency.upsert({
          where: {
            code_companyId: {
              code: currency.code,
              companyId: company.id
            }
          },
          update: {
            name: currency.name,
            symbol: currency.symbol,
            decimalPlaces: currency.decimalPlaces,
            isBase: currency.isBase,
            isActive: currency.isActive,
            exchangeRate: 1,
          },
          create: {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            decimalPlaces: currency.decimalPlaces,
            exchangeRate: 1,
            isBase: currency.isBase,
            isActive: currency.isActive,
            companyId: company.id,
          },
        });
        insertedCount++;
      } catch (error) {
        console.error(`❌ Error al insertar moneda ${currency.code}:`, error);
      }
    }
    console.log(`✅ ${insertedCount} monedas insertadas`);

    // 9. Crear Setting
    console.log('⚙️ Creando configuración...');
    await prisma.setting.upsert({
      where: { companyId: company.id },
      update: {
        currency: 'USD',
        timezone: 'America/Panama',
        defaultCostMethod: 'FIFO',
      },
      create: {
        companyId: company.id,
        currency: 'USD',
        timezone: 'America/Panama',
        defaultCostMethod: 'FIFO',
        allowNegativeInventory: false,
        taxIncluded: false,
      },
    });
    console.log('✅ Configuración creada');

    // 10. Obtener el usuario admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@empresa.com' },
    });

    if (!adminUser) {
      throw new Error('Usuario admin no encontrado');
    }

    // 11. Crear clientes
    console.log('👥 Creando clientes...');
    const clients = [
      { name: 'Cliente A', email: 'clienteA@test.com', phone: '123456789', address: 'Calle 1, Ciudad de Panamá' },
      { name: 'Cliente B', email: 'clienteB@test.com', phone: '987654321', address: 'Calle 2, Ciudad de Panamá' },
      { name: 'Cliente C', email: 'clienteC@test.com', phone: '555555555', address: 'Calle 3, Ciudad de Panamá' },
      { name: 'Cliente D', email: 'clienteD@test.com', phone: '444444444', address: 'Calle 4, Ciudad de Panamá' },
      { name: 'Cliente E', email: 'clienteE@test.com', phone: '333333333', address: 'Calle 5, Ciudad de Panamá' },
    ];

    const createdClients = [];
    for (const clientData of clients) {
      try {
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
        createdClients.push(client);
      } catch (error) {
        console.error(`❌ Error al crear cliente ${clientData.name}:`, error);
      }
    }
    console.log(`✅ ${createdClients.length} clientes creados`);

    // 12. Crear productos usando la función segura
    console.log('📦 Creando productos...');
    
    const productDataList = [
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

    const createdProducts = [];

    for (const pData of productDataList) {
      try {
        const categoryId = categoryMap[pData.category];
        
        if (!categoryId) {
          console.error(`❌ Categoría no encontrada para: ${pData.category}`);
          continue;
        }

        const result = await createOrUpdateProduct(
          pData,
          categoryId,
          company.id,
          warehouse.id
        );

        createdProducts.push(result);
        console.log(`✅ Producto procesado: ${pData.name}`);
      } catch (error) {
        console.error(`❌ Error al procesar producto ${pData.name}:`, error);
      }
    }
    console.log(`✅ ${createdProducts.length} productos creados/actualizados`);

    // 13. Crear ventas de demostración
    console.log('📈 Creando ventas de demostración...');
    let saleCount = 0;

    if (createdClients.length > 0 && createdProducts.length > 0) {
      const statuses = ['PENDING', 'QUOTE', 'ORDER', 'RESERVED', 'INVOICED', 'DELIVERED', 'COLLECTED'];
      
      // Limpiar ventas existentes para este usuario/empresa
      await prisma.sale.deleteMany({
        where: {
          companyId: company.id,
          userId: adminUser.id,
        },
      });
      
      for (let i = 0; i < 6; i++) {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - i);
        
        const salesPerMonth = 3 + Math.floor(Math.random() * 4);
        
        for (let j = 0; j < salesPerMonth; j++) {
          const client = createdClients[Math.floor(Math.random() * createdClients.length)];
          const numProducts = 1 + Math.floor(Math.random() * 3);
          const shuffledProducts = [...createdProducts].sort(() => Math.random() - 0.5);
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
          const taxRate = defaultTax.taxRate / 100;
          const tax = subtotal * taxRate;
          const total = subtotal + tax;
          
          let statusIndex = Math.min(
            Math.floor(Math.random() * (statuses.length + i / 2)),
            statuses.length - 1
          );
          const status = statuses[Math.floor(Math.random() * (statusIndex + 1))];
          
          const saleDate = new Date(monthAgo);
          saleDate.setDate(1 + Math.floor(Math.random() * 28));
          saleDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0);
          
          try {
            await prisma.sale.create({
              data: {
                number: `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                companyId: company.id,
                userId: adminUser.id,
                clientId: client.id,
                warehouseId: warehouse.id,
                status: status,
                saleDate: saleDate,
                subtotal: subtotal,
                tax: tax,
                taxName: defaultTax.taxName,
                taxRate: defaultTax.taxRate,
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
      console.log(`✅ ${saleCount} ventas de demostración creadas`);
    }

    // 14. Mostrar resumen final
    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`\n📌 Resumen:`);
    console.log(`   - Empresa: ${company.name} (${company.country})`);
    console.log(`   - Impuesto: ${defaultTax.taxName} (${defaultTax.taxRate}%)`);
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Categorías: ${categories.length}`);
    console.log(`   - Productos: ${createdProducts.length}`);
    console.log(`   - Clientes: ${createdClients.length}`);
    console.log(`   - Ventas: ${saleCount}`);
    
    console.log('\n📝 Credenciales (contraseña: admin123 para todos):');
    console.log('━'.repeat(50));
    console.log('│   Email                      │ Rol          │');
    console.log('━'.repeat(50));
    console.log(`│ admin@empresa.com            │ ADMIN        │`);
    console.log(`│ ventas@empresa.com           │ SALES        │`);
    console.log(`│ compras@empresa.com          │ PURCHASES    │`);
    console.log(`│ bodega@empresa.com           │ WAREHOUSE    │`);
    console.log(`│ contabilidad@empresa.com     │ ACCOUNTING   │`);
    console.log(`│ supervisor@empresa.com       │ SUPERVISOR   │`);
    console.log(`│ consulta@empresa.com         │ READ_ONLY    │`);
    console.log('━'.repeat(50));
    console.log('\n🔑 Contraseña para todos: admin123');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });