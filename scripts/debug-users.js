const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
  console.log('=== DATABASE USER CHECK ===\n');

  const emails = [
    'admin@capacityconnect.demo',
    'sarah.jenkins@capacityconnect.demo',
    'ravi.kumar@capacityconnect.demo',
    'admin@klu.edu'
  ];

  const users = await prisma.user.findMany({
    where: {
      email: { in: emails }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      employeeId: true,
      passwordHash: true,
      createdAt: true
    }
  });

  console.log('Found', users.length, 'user(s)\n');

  const testPasswords = {
    'admin@capacityconnect.demo': 'Admin@123',
    'admin@klu.edu': 'Admin@123',
    'sarah.jenkins@capacityconnect.demo': 'Manager@123',
    'ravi.kumar@capacityconnect.demo': 'Employee@123',
  };

  for (const u of users) {
    console.log('--- USER ---');
    console.log('Email:     ', u.email);
    console.log('Name:      ', u.name);
    console.log('Role:      ', u.role);
    console.log('OrgId:     ', u.organizationId);
    console.log('EmpId:     ', u.employeeId || '(none)');
    console.log('Hash prefix:', u.passwordHash.substring(0, 7));
    console.log('Hash length:', u.passwordHash.length);

    const testPw = testPasswords[u.email];
    if (testPw) {
      const valid = await bcrypt.compare(testPw, u.passwordHash);
      console.log('Password "' + testPw + '" valid:', valid);
    }
    console.log('');
  }

  // Check for users that are missing
  const foundEmails = users.map(u => u.email);
  for (const e of emails) {
    if (!foundEmails.includes(e)) {
      console.log('MISSING USER:', e);
    }
  }

  // Total user count in org
  const total = await prisma.user.count({ where: { organizationId: 'org-kl-university' } });
  console.log('\nTotal users in org-kl-university:', total);

  await prisma.$disconnect();
}

check().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
