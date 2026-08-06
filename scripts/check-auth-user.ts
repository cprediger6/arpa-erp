import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@empresa.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
      role: true,
      companyId: true,
    },
  });

  console.log(JSON.stringify(user, null, 2));

  if (user) {
    console.log('match-admin123', await bcrypt.compare('admin123', user.password));
    console.log('match-admin', await bcrypt.compare('admin', user.password));
    console.log('match-123456', await bcrypt.compare('123456', user.password));
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
