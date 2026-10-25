
import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { emailQueue } from "../queue/email.queue.js";

interface ScheduleCampaignInput {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  startAt: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}

export async function scheduleCampaign(
  input: ScheduleCampaignInput
) {
  const recipients = [
    ...new Set(
      input.recipients
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  if (recipients.length === 0) {
    throw new Error("At least one recipient is required");
  }

  if (input.startAt.getTime() <= Date.now()) {
    throw new Error("Start time must be in the future");
  }

  if (
    !Number.isInteger(input.delayBetweenEmailsMs) ||
    input.delayBetweenEmailsMs < 0 ||
    !Number.isInteger(input.hourlyLimit) ||
    input.hourlyLimit < 1
  ) {
    throw new Error("Invalid delay or hourly limit");
  }

  // Find the Google account belonging to the supplied user ID.
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error("User account not found. Please sign in again.");
  }

  // Find or create a sender for this user's Google email.
  const sender = await prisma.sender.upsert({
    where: {
      userId_email: {
        userId: user.id,
        email: user.email,
      },
    },
    update: {
      displayName: user.name,
      hourlyLimit: input.hourlyLimit,
    },
    create: {
      userId: user.id,
      email: user.email,
      displayName: user.name,
      hourlyLimit: input.hourlyLimit,
    },
  });

  const campaign = await prisma.$transaction(async (tx) => {
    const createdCampaign = await tx.campaign.create({
      data: {
        userId: user.id,
        senderId: sender.id,
        subject: input.subject,
        body: input.body,
        startAt: input.startAt,
        delayBetweenEmailsMs: input.delayBetweenEmailsMs,
        hourlyLimit: input.hourlyLimit,
      },
    });

    for (const [index, recipient] of recipients.entries()) {
      const email = await tx.email.create({
        data: {
          campaignId: createdCampaign.id,
          senderId: sender.id,
          recipient,
          subject: input.subject,
          body: input.body,
          scheduledAt: new Date(
            input.startAt.getTime() +
              index * input.delayBetweenEmailsMs
          ),
          idempotencyKey: randomUUID(),
        },
      });

      await tx.outboxEvent.create({
        data: {
          emailId: email.id,
          eventType: "SCHEDULE_EMAIL",
        },
      });
    }

    return createdCampaign;
  });

  return {
    campaignId: campaign.id,
    recipientCount: recipients.length,
    status: "SCHEDULED",
  };
}
