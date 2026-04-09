// server.js - MailBrain Backend
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");

const app = express();

// ─── Disable caching ─────────────────────
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ─── CORS (FIXED) ───────────────────────
const allowedOrigins = [
  "https://mailbrain.in",
  "https://www.mailbrain.in",
  "https://mail-brain-sepia.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// ─── Body Parsers ───────────────────────
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logger (dev only) ──────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── ROUTES ─────────────────────────────

// ✅ ADD THIS (Gmail OAuth routes)
app.use("/api/auth", require("./routes/auth"));

// Existing routes
app.use("/api/emails", require("./routes/emails"));
app.use("/api/payment", require("./routes/payment"));

// ─── Health Check ───────────────────────
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }),
);

// Root
app.get("/", (req, res) => {
  res.send("🚀 MailBrain API is running");
});

// ─── 404 ────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Error Handler ──────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Database ───────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// ─── Cron Job ───────────────────────────
cron.schedule("0 0 * * *", async () => {
  try {
    const User = require("./models/User");
    const now = new Date();

    await User.updateMany(
      { subscriptionStatus: "trial", trialEnds: { $lt: now } },
      { subscriptionStatus: "expired" },
    );

    await User.updateMany(
      { subscriptionStatus: "active", subscriptionEnds: { $lt: now } },
      { subscriptionStatus: "expired" },
    );

    console.log("✅ Subscription status updated");
  } catch (err) {
    console.error("Cron error:", err);
  }
});

// ─── Start Server ───────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🧠 MailBrain Backend running on port ${PORT}`);
  console.log(`📧 IMAP + Gmail API ready`);
  console.log(`🔒 Privacy: raw emails never stored\n`);
});
