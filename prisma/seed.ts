import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("bando13589", 12);

  const admin = await prisma.user.upsert({
    where: { email: "bando358@gmail.com" },
    update: {},
    create: {
      email: "bando358@gmail.com",
      name: "Super Admin",
      hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seeded super admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
