
/* Seed minimal data including an admin user and one lodge */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const pass = process.env.SEED_ADMIN_PASSWORD || "Passw0rd!";
  const hashed = await bcrypt.hash(pass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      name: "Admin User",
      prefix: "WBro",
      grandRank: null
    }
  });

  const lodge = await prisma.lodge.upsert({
    where: { name_lodgeNumber: { name: "Lodge Matariki", lodgeNumber: "402" } },
    update: {},
    create: { name: "Lodge Matariki", lodgeNumber: "402", location: "Auckland" }
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      lodgeId: lodge.id,
      startDate: new Date("2020-01-01")
    }
  });

  console.log("Seeded admin:", email);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
