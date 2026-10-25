import "dotenv/config";
import { prisma } from "./db.js";

async function main() {
  const user = await prisma.user.findUnique({
    where: { googleId: "local-test-user-001" },
  });

  if (!user) {
    throw new Error("Test user not found");
  }

  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId: user.id,
        email: process.env.ETHEREAL_USER!,
      },
    },
    update: {},
    create: {
      userId: user.id,
      email: process.env.ETHEREAL_USER!,
      displayName: "ReachInbox Test",
      hourlyLimit: 10,
    },
  });

  console.log("Test sender created or already exists:");
  console.log(sender);
}

main()
  .catch((error) => {
    console.error("Failed to create test sender:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });