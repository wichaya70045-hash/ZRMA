import { PrismaClient, Prisma } from '@prisma/client';
import { seedInitialDatabaseWithClient } from '../src/lib/seedData.mjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZRMA PostgreSQL database via Prisma...');
  await seedInitialDatabaseWithClient(prisma, Prisma);
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
