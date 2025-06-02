import { PrismaClient } from "@prisma/client"
import { hashPassword } from "@/lib/password-utils"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hashPassword("admin123")
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
      isActive: true,
    },
  })

  // Create manager user
  const managerPassword = await hashPassword("manager123")
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@example.com",
      password: managerPassword,
      role: "manager",
      isActive: true,
    },
  })

  // Create employee user
  const employeePassword = await hashPassword("employee123")
  await prisma.user.upsert({
    where: { email: "employee@example.com" },
    update: {},
    create: {
      name: "Employee User",
      email: "employee@example.com",
      password: employeePassword,
      role: "employee",
      isActive: true,
    },
  })

  console.log("Seed completed")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

