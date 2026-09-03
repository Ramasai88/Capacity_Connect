import { prisma } from "../lib/db/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, organizationId: true, employeeId: true }
  });
  console.log("=== USERS IN POSTGRESQL ===");
  console.log(JSON.stringify(users, null, 2));

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, email: true, employeeCode: true, organizationId: true }
  });
  console.log("=== EMPLOYEES IN POSTGRESQL ===");
  console.log(JSON.stringify(employees, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
