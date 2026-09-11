const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alertLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      device: true
    }
  });
  console.log("Alert logs:");
  for (const a of alerts) {
    console.log(`AlertLog ID: ${a.id} | Device: ${a.device?.name} (${a.device?.ipAddress}) | Status: ${a.status} | CreatedAt: ${a.createdAt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
