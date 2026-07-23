// prisma/seed-full.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const currencies = [
  { id: '01dcc812-8b80-413e-9c90-3328a3661b04', code: 'MXN', name: 'Peso mexicano', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '1651d206-db2d-427e-b185-d5b9be602e6e', code: 'HTG', name: 'Gourde haitiano', symbol: 'G', decimalPlaces: 2, isBase: false },
  { id: '1e3d0741-5509-44f7-8700-1a1f25a1a232', code: 'PEN', name: 'Sol peruano', symbol: 'S/', decimalPlaces: 2, isBase: false },
  { id: '2245b7e2-5732-4c09-b631-b80c7da8feca', code: 'XCD', name: 'Dólar del Caribe Oriental', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '26e7698a-4a0c-4b04-b9de-ca319334cf07', code: 'UYU', name: 'Peso uruguayo', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '2b5a3a77-e552-4e22-bb61-19a637666c9a', code: 'BRL', name: 'Real brasileño', symbol: 'R$', decimalPlaces: 2, isBase: false },
  { id: '306705f3-f5d7-4891-aba1-8f0b8529867c', code: 'NIO', name: 'Córdoba nicaragüense', symbol: 'C$', decimalPlaces: 2, isBase: false },
  { id: '355f11c3-31dd-4d19-a93a-f1a2ef5b235f', code: 'CLP', name: 'Peso chileno', symbol: '$', decimalPlaces: 0, isBase: false },
  { id: '3ef01365-616f-4df5-8097-a10d2571d1a2', code: 'CAD', name: 'Dólar canadiense', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '53f7bd6a-9133-4485-b667-719ba7984823', code: 'USD', name: 'Dólar estadounidense', symbol: '$', decimalPlaces: 2, isBase: true },
  { id: '5f8ff54a-707c-4ada-840e-d9c12d1227c2', code: 'CUP', name: 'Peso cubano', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '68bbe15e-6fae-45d2-b541-0f73e0516178', code: 'JMD', name: 'Dólar jamaiquino', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '6a7a4c79-8dba-4aea-bafd-71ad4f4bc28c', code: 'GTQ', name: 'Quetzal', symbol: 'Q', decimalPlaces: 2, isBase: false },
  { id: '92777c8c-401f-4d80-985b-4a36020d64bf', code: 'TTD', name: 'Dólar de Trinidad y Tobago', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: '9553aa94-3a03-412f-91e2-fa8fafde74c4', code: 'HNL', name: 'Lempira', symbol: 'L', decimalPlaces: 2, isBase: false },
  { id: '9ba60090-8df2-40eb-bcf9-9cdc5400e7c6', code: 'BZD', name: 'Dólar beliceño', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'a9260dd9-56b7-47a8-a6bd-a545ad229c0d', code: 'ARS', name: 'Peso argentino', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'aebb22e0-95d0-4332-b340-7c9adbc0d52e', code: 'BOB', name: 'Boliviano', symbol: 'Bs', decimalPlaces: 2, isBase: false },
  { id: 'b9171a4d-c750-40b6-a34b-7dc37fe5de86', code: 'COP', name: 'Peso colombiano', symbol: '$', decimalPlaces: 0, isBase: false },
  { id: 'c2d67dd8-0a5d-47c4-822f-aa4003f9f34d', code: 'PAB', name: 'Balboa panameño', symbol: 'B/.', decimalPlaces: 2, isBase: false },
  { id: 'dc026229-d6fb-4d53-81e5-8721c78981b3', code: 'SRD', name: 'Dólar surinamés', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'e81c2ddf-4e20-4f8f-b6ed-a81098fe7133', code: 'BSD', name: 'Dólar bahameño', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'f05222f6-026a-4647-9c73-9ab343365624', code: 'BBD', name: 'Dólar de Barbados', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'f36f2af0-5e1b-4792-a09e-a0d696b1a317', code: 'CRC', name: 'Colón costarricense', symbol: '₡', decimalPlaces: 2, isBase: false },
  { id: 'f6635dce-126a-4e69-9cab-40b9eaedf043', code: 'PYG', name: 'Guaraní', symbol: '₲', decimalPlaces: 0, isBase: false },
  { id: 'f82821ea-75fe-49a9-b51c-ac0eaa644f0e', code: 'VES', name: 'Bolívar', symbol: 'Bs.', decimalPlaces: 2, isBase: false },
  { id: 'f8f888fc-3266-4fda-80f8-3db44ff06d08', code: 'GYD', name: 'Dólar guyanés', symbol: '$', decimalPlaces: 2, isBase: false },
  { id: 'fb9d603d-42a7-428c-880c-9be685e586fb', code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', decimalPlaces: 2, isBase: false },
];

async function main() {
  console.log('🌱 Iniciando seed en NeonDB...');

  // 1. Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...');
  await prisma.$executeRaw`TRUNCATE TABLE "Currency" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Category" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Company" CASCADE;`;
  console.log('✅ Datos limpiados');

  // 2. Crear empresa
  console.log('📦 Creando empresa demo...');
  const company = await prisma.company.create({
    data: {
      id: 'company-demo',
      name: 'Empresa Demo',
      ruc: '123456789',
      address: 'Ciudad de Panamá',
      currency: 'USD',
      timezone: 'America/Panama',
      country: 'Panama',
      taxRate: 7,
    },
  });
  console.log('✅ Empresa creada:', company.name);

  // 3. Crear usuario admin
  console.log('👤 Creando usuario admin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      id: 'user-admin',
      email: 'admin@empresa.com',
      password: hashedPassword,
      name: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      companyId: company.id,
      isActive: true,
    },
  });
  console.log('✅ Usuario admin creado:', user.email);

  // 4. Crear categorías
  console.log('📂 Creando categorías...');
  const categories = [
    { id: 'category-electronica', name: 'Electrónicos', description: 'Productos electrónicos y tecnología' },
    { id: 'category-ropa', name: 'Ropa', description: 'Prendas de vestir y accesorios' },
    { id: 'category-alimentos', name: 'Alimentos', description: 'Productos alimenticios y bebidas' },
    { id: 'category-hogar', name: 'Hogar', description: 'Artículos para el hogar' },
    { id: 'category-deportes', name: 'Deportes', description: 'Equipamiento deportivo' },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        companyId: company.id,
      },
    });
  }
  console.log(`✅ ${categories.length} categorías creadas`);

  // 5. Insertar monedas
  console.log('💰 Insertando monedas...');
  for (const currency of currencies) {
    await prisma.currency.create({
      data: {
        id: currency.id,
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        decimalPlaces: currency.decimalPlaces,
        exchangeRate: 1,
        isBase: currency.isBase,
        isActive: true,
        companyId: company.id,
      },
    });
  }
  console.log(`✅ ${currencies.length} monedas insertadas`);

  console.log('🎉 Seed completado exitosamente!');
  console.log('📝 Credenciales:');
  console.log('   Email: admin@empresa.com');
  console.log('   Contraseña: admin123');
  console.log('   URL: http://localhost:3000');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });