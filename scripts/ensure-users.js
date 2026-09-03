const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found!");
    return;
  }

  const adminHash = await bcrypt.hash("Admin@123", 10);
  const managerHash = await bcrypt.hash("Manager@123", 10);
  const employeeHash = await bcrypt.hash("Employee@123", 10);

  // 1. Admin: Dr. K. Srinivas (admin@capacityconnect.demo)
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@capacityconnect.demo" } },
    update: {
      name: "Dr. K. Srinivas",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Dr. K. Srinivas",
      email: "admin@capacityconnect.demo",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  // 2. Admin: Admin User (admin@klu.edu)
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@klu.edu" } },
    update: {
      name: "Dr. K. Srinivas",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Dr. K. Srinivas",
      email: "admin@klu.edu",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  // 3. Manager: Sarah Jenkins (sarah.jenkins@capacityconnect.demo)
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "sarah.jenkins@capacityconnect.demo" } },
    update: {
      name: "Sarah Jenkins",
      passwordHash: managerHash,
      role: UserRole.MANAGER,
    },
    create: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@capacityconnect.demo",
      passwordHash: managerHash,
      role: UserRole.MANAGER,
      organizationId: org.id,
    },
  });

  // 4. Employee: Ravi Kumar (ravi.kumar@capacityconnect.demo)
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "ravi.kumar@capacityconnect.demo" } },
    update: {
      name: "Ravi Kumar",
      passwordHash: employeeHash,
      role: UserRole.EMPLOYEE,
      employeeId: "emp-1",
    },
    create: {
      name: "Ravi Kumar",
      email: "ravi.kumar@capacityconnect.demo",
      passwordHash: employeeHash,
      role: UserRole.EMPLOYEE,
      organizationId: org.id,
      employeeId: "emp-1",
    },
  });

  console.log("✓ User accounts verified & synchronized in PostgreSQL.");
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, organizationId: true, employeeId: true },
  });
  console.log("Current DB Users:", allUsers);

  await prisma.$disconnect();
}

main().catch(console.error);
