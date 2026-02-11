import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.todo.upsert({
    where: { id: 'seed-todo' },
    update: {},
    create: { id: 'seed-todo', title: 'Seed todo', completed: false }
  });
}

main()
  .catch(async (error) => {
    console.error('seed_failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
