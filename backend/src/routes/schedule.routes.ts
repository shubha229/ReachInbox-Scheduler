
import { Router } from "express";
import { z } from "zod";
import { scheduleCampaign } from "../services/scheduler.service.js";
import { publishPendingEmails } from "../queue/outbox.publisher.js";
import { prisma } from "../db.js";

const router = Router();

const scheduleSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1).max(5000),
  startAt: z.string().datetime({ offset: true }),
  delayBetweenEmailsMs: z.number().int().min(0).max(3600000),
  hourlyLimit: z.number().int().min(1).max(10000),
});

router.get("/", async (req, res) => {
  const userId =
    typeof req.query.userId === "string"
      ? req.query.userId
      : "";

  const parsedUserId = z.string().uuid().safeParse(userId);

  if (!parsedUserId.success) {
    return res.status(400).json({
      error: "A valid userId is required",
    });
  }

  try {
    const rows = await prisma.email.findMany({
      where: {
        campaign: {
          is: { userId },
        },
        status: {
          not: "CANCELLED",
        },
      },
      orderBy: {
        scheduledAt: "desc",
      },
      select: {
        id: true,
        recipient: true,
        subject: true,
        body: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
      },
    });

    const emails = rows.map((email) => ({
      id: email.id,
      to: [email.recipient],
      subject: email.subject,
      body: email.body,
      status:
        email.status === "SENT"
          ? "Sent"
          : email.status === "FAILED"
            ? "Failed"
            : "Scheduled",
      scheduledAt: email.scheduledAt.toLocaleString(),
      sentAt: email.sentAt?.toLocaleString(),
    }));

    return res.json({ emails });
  } catch (error) {
    console.error("Failed to load emails:", error);

    return res.status(500).json({
      error: "Unable to load emails from the database",
    });
  }
});

router.post("/", async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid scheduling data",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await scheduleCampaign({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
    });

    try {
      await publishPendingEmails();
    } catch (error) {
      // The database outbox remains available for a later retry.
      console.error("Outbox publishing failed:", error);
    }

    return res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scheduling failed";

    return res.status(400).json({ error: message });
  }
});

export default router;
