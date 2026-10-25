import "dotenv/config";
import { prisma } from "./db.js";

async function main() {
  const user = await prisma.user.upsert({
    where: {
      googleId: "local-test-user-001",
    },
    update: {},
    create: {
      googleId: "local-test-user-001",
      name: "ReachInbox Test User",
      email: "testuser@example.com",
    },
  });

  console.log("Test user created or already exists:");
  console.log(user);
}

main()
  .catch((error) => {
    console.error("Failed to create test user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });