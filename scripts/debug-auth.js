const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function test() {
  const normalizedEmail = "admin@capacityconnect.demo".toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
  });
  console.log("Found User:", user);
  if (user) {
    const valid = await bcrypt.compare("Admin@123", user.passwordHash);
    console.log("Password valid:", valid);
  }
  await prisma.$disconnect();
}

test();
