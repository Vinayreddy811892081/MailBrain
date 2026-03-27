// server.js - MailBrain Backend
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "https://mail-brain-sepia.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

// Raw body for Razorpay webhook
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/emails", require("./routes/emails"));
app.use("/api/payment", require("./routes/payment"));

// Health check
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }),
);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Database ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// ─── Cron: Expire trials & subscriptions daily ────────────────
cron.schedule("0 0 * * *", async () => {
  try {
    const User = require("./models/User");
    const now = new Date();

    // Expire trials
    await User.updateMany(
      { subscriptionStatus: "trial", trialEnds: { $lt: now } },
      { subscriptionStatus: "expired" },
    );

    // Expire paid subscriptions
    await User.updateMany(
      { subscriptionStatus: "active", subscriptionEnds: { $lt: now } },
      { subscriptionStatus: "expired" },
    );

    console.log("✅ Subscription status updated");
  } catch (err) {
    console.error("Cron error:", err);
  }
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🧠 MailBrain Backend running on port ${PORT}`);
  console.log(`📧 IMAP-based email - no Gmail API required`);
  console.log(`🔒 Privacy: raw emails never stored\n`);
});

app.get("/", (req, res) => {
  res.send("🚀 MailBrain API is running");
});
