const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, organizationId: true, employeeId: true },
  });
  console.log("DB_USERS_FOUND:", users);
  await prisma.$disconnect();
}

main().catch(console.error);
