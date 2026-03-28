// routes/emails.js
const express = require("express");
const mongoose = require("mongoose");
const { auth, requireSubscription } = require("../middleware/auth");
const {
  detectImapSettings,
  testConnection,
  fetchRecentEmails,
  sendEmail,
} = require("../services/imapService");
const {
  analyzeEmail,
  generateReply,
  batchAnalyzeEmails,
} = require("../services/aiService");
const EmailCache = require("../models/EmailCache");
const User = require("../models/User");

const router = express.Router();

// Connect email account
router.post("/connect", auth, requireSubscription, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const imapSettings = detectImapSettings(email);
    const config = {
      email,
      password,
      imapHost: imapSettings.host,
      imapPort: imapSettings.port,
      smtpHost: imapSettings.smtpHost,
      smtpPort: imapSettings.smtpPort,
    };
    //console.log("FINAL CONFIG:", config);

    // Test connection first
    await testConnection(config);

    // Save encrypted config (password stored for IMAP auth only)
    req.user.emailAccount = {
      email,
      password, // stored for IMAP - user chose to connect
      imapHost: imapSettings.host,
      imapPort: imapSettings.port,
      smtpHost: imapSettings.smtpHost,
      smtpPort: imapSettings.smtpPort,
      connected: true,
    };
    await req.user.save();

    res.json({
      success: true,
      message: "Email connected successfully",
      provider: imapSettings.host,
    });
  } catch (err) {
    console.error("❌ Connect error FULL:", err);
    console.error("❌ Message:", err.message);

    let errorMsg = "Connection failed. Check credentials.";

    if (err.message?.includes("Invalid credentials")) {
      errorMsg = "Wrong email or password. For Gmail, use an App Password.";
    }

    if (err.message?.includes("timeout")) {
      errorMsg = "Connection timed out. Check your IMAP settings.";
    }

    return res.status(400).json({
      error: errorMsg,
      hint: "For Gmail: Enable IMAP + use App Password",
    });
  }
});

// Disconnect email account
router.post("/disconnect", auth, async (req, res) => {
  try {
    req.user.emailAccount = { connected: false };
    await req.user.save();
    // Delete all cached summaries for this user
    await EmailCache.deleteMany({ userId: req.user._id });
    res.json({
      success: true,
      message: "Email disconnected and all cached data deleted",
    });
  } catch (err) {
    res.status(500).json({ error: "Disconnect failed" });
  }
});

// Fetch & analyze emails (main endpoint)
router.get("/fetch", auth, requireSubscription, async (req, res) => {
  try {
    const { category, refresh } = req.query;

    if (!req.user.emailAccount?.connected) {
      return res
        .status(400)
        .json({ error: "No email account connected", code: "NOT_CONNECTED" });
    }

    // Return cached if available and not forcing refresh
    if (!refresh) {
      const query = { userId: req.user._id };
      if (category && category !== "all") query.category = category;

      const cached = await EmailCache.find(query)
        .sort({ receivedAt: -1 })
        .limit(50)
        .lean();

      if (cached.length > 0) {
        return res.json({ emails: cached, fromCache: true });
      }
    }

    // Clear old cache for this user
    await EmailCache.deleteMany({ userId: req.user._id });

    // Fetch live from IMAP (raw emails NOT stored)
    const rawEmails = await fetchRecentEmails(req.user.emailAccount, 10);

    // AI analyze all emails
    const analyses = await batchAnalyzeEmails(rawEmails);

    // Store only AI summaries (not raw email content)
    const toSave = rawEmails.map((email, i) => {
      const ai = analyses[i] || {};

      return {
        userId: req.user._id,
        messageId: email.messageId,
        from: email.from,
        fromName: email.fromName,
        subject: email.subject,
        receivedAt: email.receivedAt,

        // ✅ SAFE ACCESS (no crash)
        aiSummary: ai.summary || email.subject || "No summary",
        whatTheyWant: ai.whatTheyWant || "Check email",
        suggestedReplies: ai.suggestedReplies || ["OK", "Thanks"],
        category: ai.category || "noise",
      };
    });
    // Bulk insert
    await EmailCache.insertMany(toSave, { ordered: false }).catch(() => {});

    // Filter by category if requested
    const filtered =
      category && category !== "all"
        ? toSave.filter((e) => e.category === category)
        : toSave;

    const savedEmails = await EmailCache.find({ userId: req.user._id })
      .sort({ receivedAt: -1 })
      .limit(50)
      .lean();
    res.json({
      emails: savedEmails,
      fromCache: false,
      total: rawEmails.length,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch emails: " + err.message });
  }
});

// Get category counts
router.get("/categories", auth, requireSubscription, async (req, res) => {
  try {
    const counts = await EmailCache.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const result = {
      urgent: 0,
      jobs: 0,
      bills: 0,
      company: 0,
      unreplied: 0,
      noise: 0,
    };
    counts.forEach((c) => {
      result[c._id] = c.count;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to get categories" });
  }
});

// Generate custom reply
router.post("/reply/generate", auth, requireSubscription, async (req, res) => {
  try {
    const { emailId, instruction } = req.body;
    const email = await EmailCache.findOne({
      _id: emailId,
      userId: req.user._id,
    });
    if (!email) return res.status(404).json({ error: "Email not found" });

    const reply = await generateReply(
      {
        fromName: email.fromName,
        subject: email.subject,
        aiSummary: email.aiSummary,
      },
      instruction || "Write a professional reply",
    );

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate reply" });
  }
});

// Send reply
router.post("/reply/send", auth, requireSubscription, async (req, res) => {
  try {
    const { emailId, replyText, subject } = req.body;

    if (!req.user.emailAccount?.connected) {
      return res.status(400).json({ error: "No email account connected" });
    }

    const email = await EmailCache.findOne({
      _id: emailId,
      userId: req.user._id,
    });
    if (!email) return res.status(404).json({ error: "Email not found" });

    await sendEmail(
      req.user.emailAccount,
      email.from,
      `Re: ${subject || email.subject}`,
      replyText,
    );

    // Mark as replied
    await EmailCache.updateOne({ _id: emailId }, { isReplied: true });

    res.json({ success: true, message: "Reply sent!" });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ error: "Failed to send reply: " + err.message });
  }
});

// Mark email as read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ PREVENT CRASH
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid email ID" });
    }

    await EmailCache.updateOne(
      { _id: id, userId: req.user._id },
      { isRead: true },
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Read error:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

module.exports = router;
