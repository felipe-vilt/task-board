import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.board.findFirst();
  if (existing) {
    console.log("seed: board already exists, skipping");
    return;
  }

  const board = await prisma.board.create({
    data: {
      name: "Meu Quadro",
      slug: `meu-quadro-${Date.now().toString(36)}`,
      description: "Board padrão criado na inicialização",
      columns: {
        create: [
          { name: "Backlog", position: 0, isSystem: true },
          { name: "Executando", position: 1, isSystem: true },
          { name: "Impedido", position: 2, isSystem: true },
          { name: "Concluído", position: 3, isSystem: true },
        ],
      },
    },
    include: { columns: true },
  });

  console.log(`seed: created board ${board.id} with ${board.columns.length} columns`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
