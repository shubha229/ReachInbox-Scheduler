
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";

const router = Router();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

if (!clientId || !clientSecret || !callbackUrl) {
  throw new Error("Google OAuth environment variables are missing");
}

const googleClient = new OAuth2Client(
  clientId,
  clientSecret,
  callbackUrl
);

// Start Google login
router.get("/google", (_req, res) => {
  const url = googleClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  res.redirect(url);
});

// Handle Google's callback
router.get("/google/callback", async (req, res) => {
  try {
    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;

    if (!code) {
      res.status(400).send("Google authorization code is missing");
      return;
    }

    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      res.status(401).send("Google did not return an ID token");
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const profile = ticket.getPayload();

    if (
      !profile?.sub ||
      !profile.email ||
      profile.email_verified !== true
    ) {
      res.status(401).send("Unable to verify your Google account");
      return;
    }

    const user = await prisma.user.upsert({
      where: { googleId: profile.sub },
      update: {
        email: profile.email,
        name: profile.name || profile.email,
        avatarUrl: profile.picture || null,
      },
      create: {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name || profile.email,
        avatarUrl: profile.picture || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    req.session.userId = user.id;

    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/?auth=success`
    );
  } catch (error) {
    console.error("Google login failed:", error);
    res.status(500).send("Google login failed. Please try again.");
  }
});

// Get the currently logged-in user
router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ message: "Not logged in" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Unable to fetch current user:", error);
    res.status(500).json({ message: "Unable to fetch user" });
  }
});

// Log out
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ message: "Logout failed" });
      return;
    }

    res.clearCookie("reachinbox.sid", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.json({ message: "Logged out" });
  });
});

export default router;
