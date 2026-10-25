
import "dotenv/config";
import { prisma } from "../db.js";
import { emailQueue } from "./email.queue.js";

export async function publishPendingEmails() {
  const events = await prisma.outboxEvent.findMany({
    where: {
      publishedAt: null,
      eventType: "SCHEDULE_EMAIL",
    },
    include: {
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100,
  });

  let published = 0;

  for (const event of events) {
    const email = event.email;

    if (
      email.status === "CANCELLED" ||
      email.status === "SENT"
    ) {
      continue;
    }

    await emailQueue.add(
      "send-email",
      { emailId: email.id },
      {
        jobId: `email-${email.id}`,
        delay: Math.max(
          0,
          email.scheduledAt.getTime() - Date.now()
        ),
      }
    );

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { publishedAt: new Date() },
    });

    await prisma.email.update({
      where: { id: email.id },
      data: { status: "QUEUED" },
    });

    published++;
  }

  return published;
}
