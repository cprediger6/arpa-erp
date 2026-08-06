// lib/scripts/check-stock.ts
import { prisma } from "@/lib/prisma";

async function checkStock() {
  const productId = "cms3emt5x0001jj04r8tmhmtt";

  console.log(`🔍 Verificando stock del producto ${productId}...`);

  // Buscar todos los items de inventario para este producto
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      productId: productId,
    },
    include: {
      warehouse: true,
      product: true,
      variant: true,
    },
  });

  console.log(`📦 Encontrados ${inventoryItems.length} items de inventario:`);
  
  for (const item of inventoryItems) {
    console.log(`  - Almacén: ${item.warehouse?.name || "Sin almacén"}`);
    console.log(`    Variante: ${item.variant?.name || "Principal"}`);
    console.log(`    Current Stock: ${item.currentStock}`);
    console.log(`    Available Stock: ${item.availableStock}`);
    console.log(`    Reserved: ${item.reservedStock}`);
    console.log(`    ID: ${item.id}`);
    console.log(`    Product ID: ${item.productId}`);
    console.log(`    Variant ID: ${item.variantId || "null"}`);
    console.log("---");
  }

  // También verificar el producto
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
    },
  });

  console.log(`\n📦 Producto: ${product?.name}`);
  console.log(`   SKU: ${product?.sku}`);
  console.log(`   Variantes: ${product?.variants.length || 0}`);
  
  for (const variant of product?.variants || []) {
    console.log(`     - ${variant.name}: ${variant.value} (ID: ${variant.id})`);
  }
}

checkStock()
  .catch(console.error)
  .finally(() => prisma.$disconnect());