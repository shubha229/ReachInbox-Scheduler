
import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { prisma } from "../db.js";
import { redisConnection } from "../config/redis.js";
import { transporter } from "../mail/smtp.js";
import type { ScheduleEmailJob } from "./email.queue.js";
import { DelayedError } from "bullmq";
import { reserveSendSlot } from "../rate-limiter/hourlyLimiter.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY || 5);

export const emailWorker = new Worker<ScheduleEmailJob>(
  "email-scheduler",
  async (job: Job<ScheduleEmailJob>) => {
    const email = await prisma.email.findUnique({
      where: { id: job.data.emailId },
      include: { sender: true, attachments: true},
    });

    if (!email) {
      throw new Error(`Email ${job.data.emailId} not found`);
    }

    if (email.status === "SENT" || email.status === "CANCELLED") return;

    const remaining = email.scheduledAt.getTime() - Date.now();

    if (remaining > 0) {
    await job.moveToDelayed(Date.now() + remaining, job.token!);
    throw new DelayedError();
    }

    const hourlyLimit = Math.min(
    email.sender.hourlyLimit,
    Number(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || 200)
    );

    const minDelayMs = Number(
    process.env.MIN_DELAY_BETWEEN_EMAILS_MS || 2000
    );

    const slot = await reserveSendSlot(
    email.senderId,
    hourlyLimit,
    minDelayMs
    );

    if (!slot.allowed) {
    await job.moveToDelayed(slot.retryAt, job.token!);
    throw new DelayedError();
    }
    const attemptNumber = email.attempts + 1;

    const attempt = await prisma.emailAttempt.create({
      data: {
        emailId: email.id,
        attemptNumber,
        status: "STARTED",
      },
    });

    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    try {
      const result = await transporter.sendMail({
        from: {
          name: email.sender.displayName || email.sender.email,
          address: email.sender.email,
        },
        to: email.recipient,
        subject: email.subject,
        html: email.body,
        text: email.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      });

      await prisma.$transaction([
        prisma.email.update({
          where: { id: email.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            providerMessageId: result.messageId,
            lastError: null,
          },
        }),
        prisma.emailAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "SENT",
            finishedAt: new Date(),
            providerMessageId: result.messageId,
          },
        }),
      ]);

      console.log(`Email sent: ${email.recipient}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      await prisma.$transaction([
        prisma.email.update({
          where: { id: email.id },
          data: { status: "QUEUED", lastError: message },
        }),
        prisma.emailAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "RETRYABLE_FAILURE",
            finishedAt: new Date(),
            errorMessage: message,
          },
        }),
      ]);

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email job failed: ${job?.id}`, error.message);
});
