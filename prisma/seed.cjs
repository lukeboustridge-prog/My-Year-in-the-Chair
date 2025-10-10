/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      isApproved: true,
    }
  });

  const resources = [
    { slug: 'masters-checklist', title: 'Master’s Checklist', summary: 'Key tasks across your year', url: 'https://example.com/masters-checklist' },
    { slug: 'opening-ritual-tips', title: 'Opening Ritual Tips', summary: 'Refinements and reminders', url: 'https://example.com/opening-ritual-tips' }
  ];
  for (const r of resources) {
    await prisma.resource.upsert({ where: { slug: r.slug }, update: {}, create: r });
  }

  const badges = [
    { code: 'FIRST_VISIT', name: 'First Visit Logged', points: 10, criteria: 'Log your first visit' },
    { code: 'FIVE_VISITS', name: 'Five Visits', points: 25, criteria: 'Log five visits' },
    { code: 'TEN_VISITS', name: 'Ten Visits', points: 50, criteria: 'Log ten visits' }
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }

  console.log('Seeded admin@example.com / password123');
}
main().finally(()=>prisma.$disconnect());
