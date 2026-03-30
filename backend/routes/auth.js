const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { google } = require("googleapis");

const router = express.Router();

// ─── TOKEN GENERATOR ───────────────────────
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ─── GOOGLE OAUTH CONFIG ───────────────────
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// ─── REGISTER ──────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be 8+ characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      subscriptionStatus: "trial",
      trialEnds: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toSafeJSON(),
      trialDays: parseInt(process.env.TRIAL_DAYS) || 5,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN ─────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toSafeJSON(),
      subscriptionActive: user.isSubscriptionActive(),
      daysLeft: user.getDaysLeft(),
    });
  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── GET CURRENT USER ──────────────────────
router.get("/me", auth, async (req, res) => {
  res.json({
    user: {
      ...req.user.toSafeJSON(),

      // ✅ ADD THIS
      google: req.user.google ? { email: req.user.google.email } : null,
    },
    subscriptionActive: req.user.isSubscriptionActive(),
    daysLeft: req.user.getDaysLeft(),
    subscriptionStatus: req.user.subscriptionStatus,
  });
});

// ─── GOOGLE CONNECT EMAIL ──────────────────
// IMPORTANT:
// frontend must call /api/auth/google?token=JWT_TOKEN
router.get("/google", async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).json({ error: "Missing auth token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      state: decoded.userId, // ✅ keep currently logged-in MailBrain user
    });

    res.redirect(url);
  } catch (err) {
    console.error("Google connect start error:", err);
    res.status(401).json({ error: "Invalid auth token" });
  }
});

// ─── GOOGLE CALLBACK (CONNECT ONLY, NOT LOGIN) ─────────────
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/app`);
    }

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    const user = await User.findById(state);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/app`);
    }

    // ✅ attach Gmail to the currently logged-in MailBrain user
    user.google = {
      email: data.email,
      refreshToken: tokens.refresh_token || user.google?.refreshToken || "",
      accessToken: tokens.access_token || user.google?.accessToken || "",
    };

    await user.save();

    // ✅ go back to app, do NOT log in as Google account
    res.redirect(`${process.env.FRONTEND_URL}/app?gmail_connected=1`);
  } catch (err) {
    console.error("Google auth error:", err);
    res.redirect(`${process.env.FRONTEND_URL}/app?gmail_connected=0`);
  }
});

module.exports = router;
