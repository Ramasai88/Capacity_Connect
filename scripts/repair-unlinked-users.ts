import { prisma } from "../lib/db/prisma";

async function repairUnlinkedUsers() {
  console.log("Repairing unlinked EMPLOYEE users in PostgreSQL...");

  const unlinkedEmployees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      employeeId: null,
    },
  });

  console.log(`Found ${unlinkedEmployees.length} unlinked EMPLOYEE user(s).`);

  for (const user of unlinkedEmployees) {
    const normalizedEmail = user.email.toLowerCase().trim();

    // 1. Check if employee record already exists with this email
    let employee = await prisma.employee.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        organizationId: user.organizationId,
      },
    });

    // 2. If not, create it
    if (!employee) {
      const empCount = await prisma.employee.count({ where: { organizationId: user.organizationId } });
      const candidateCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;
      const existingCode = await prisma.employee.findUnique({
        where: {
          organizationId_employeeCode: {
            organizationId: user.organizationId,
            employeeCode: candidateCode,
          },
        },
      });
      const employeeCode = existingCode ? `EMP-${Date.now().toString(36).toUpperCase()}` : candidateCode;

      employee = await prisma.employee.create({
        data: {
          organizationId: user.organizationId,
          employeeCode,
          name: user.name,
          email: normalizedEmail,
          status: "ACTIVE",
        },
      });
      console.log(`  ✓ Created Employee record for ${user.email} (ID: ${employee.id}, Code: ${employee.employeeCode})`);
    } else {
      console.log(`  ✓ Found existing Employee record for ${user.email} (ID: ${employee.id})`);
    }

    // 3. Link User.employeeId
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: employee.id },
    });
    console.log(`  ✓ Linked User ${user.id} -> Employee ${employee.id}`);
  }

  console.log("All EMPLOYEE users are now linked to valid Employee workforce profiles!");
  await prisma.$disconnect();
}

repairUnlinkedUsers().catch(console.error);
