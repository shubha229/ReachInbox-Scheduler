
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { prisma } from "./db.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { emailWorker } from "./queue/email.worker.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from backend/.env");
}

app.use(
  session({
    name: "reachinbox.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Local HTTP development only
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);

app.get("/api/health", async (_req, res) => {
  res.json({ status: "ok", message: "ReachInbox API is running" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: "Database connection failed. Check backend logs.",
    });
  }
});

const PORT = Number(process.env.PORT || 5000);

const server = app.listen(PORT, () => {
  console.log(`ReachInbox API running at http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("Shutting down ReachInbox...");
  server.close();
  await emailWorker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
