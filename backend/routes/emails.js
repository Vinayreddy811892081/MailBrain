const express = require("express");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const { auth, requireSubscription } = require("../middleware/auth");
const {
  detectImapSettings,
  testConnection,
  fetchRecentEmails,
  sendEmail,
} = require("../services/imapService");
const { generateReply, batchAnalyzeEmails } = require("../services/aiService");
const EmailCache = require("../models/EmailCache");

const router = express.Router();

const sendEmailWithGmail = async (user, to, subject, text) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oAuth2Client.setCredentials({
    refresh_token: user.google.refreshToken,
    access_token: user.google.accessToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const message = [
    `From: ${user.google.email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
};

// Connect email account
router.post("/connect", auth, requireSubscription, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const imapSettings = detectImapSettings(email);
    const config = {
      email,
      password,
      imapHost: imapSettings.host,
      imapPort: imapSettings.port,
      smtpHost: imapSettings.smtpHost,
      smtpPort: imapSettings.smtpPort,
    };

    await testConnection(config);

    req.user.emailAccount = {
      email,
      password,
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

    if (err.message?.toLowerCase().includes("timeout")) {
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
    req.user.google = {
      email: "",
      refreshToken: "",
      accessToken: "",
    };

    await req.user.save();
    await EmailCache.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: "Email disconnected and all cached data deleted",
    });
  } catch (err) {
    res.status(500).json({ error: "Disconnect failed" });
  }
});

// Fetch & analyze emails
router.get("/fetch", auth, requireSubscription, async (req, res) => {
  try {
    const { category, refresh } = req.query;

    const isGoogleConnected =
      !!req.user.google?.refreshToken || !!req.user.google?.accessToken;
    const isImapConnected = !!req.user.emailAccount?.connected;

    // ✅ FIX: allow either Google OR IMAP
    if (!isImapConnected && !isGoogleConnected) {
      return res.status(400).json({
        error: "No email connected",
        code: "NOT_CONNECTED",
      });
    }

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

    await EmailCache.deleteMany({ userId: req.user._id });

    let rawEmails = [];

    if (isGoogleConnected) {
      console.log("📩 Fetching from Gmail API");

      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      );

      oAuth2Client.setCredentials({
        access_token: req.user.google.accessToken,
        refresh_token: req.user.google.refreshToken,
      });

      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      const resGmail = await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        labelIds: ["INBOX"], // ✅ only inbox
        q: "-from:me", // ✅ exclude sent-by-you messages
      });

      const messages = resGmail.data.messages || [];

      for (const msg of messages) {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = full.data.payload?.headers || [];
        const parts = full.data.payload?.parts || [];

        const getHeader = (name) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || "";

        let bodyText = "";

        if (full.data.payload?.body?.data) {
          bodyText = Buffer.from(
            full.data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
            "base64",
          ).toString("utf8");
        } else {
          const textPart = parts.find((p) => p.mimeType === "text/plain");
          if (textPart?.body?.data) {
            bodyText = Buffer.from(
              textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"),
              "base64",
            ).toString("utf8");
          }
        }

        const fromHeader = getHeader("From");
        const subjectHeader = getHeader("Subject") || "(no subject)";

        const emailMatch = fromHeader.match(/<(.+?)>/);
        const nameMatch = fromHeader
          .replace(/<(.+?)>/, "")
          .replace(/"/g, "")
          .trim();

        rawEmails.push({
          messageId: msg.id,
          from: emailMatch ? emailMatch[1] : fromHeader,
          fromName: nameMatch || (emailMatch ? emailMatch[1] : fromHeader),
          subject: subjectHeader,
          bodyText: (bodyText || "").substring(0, 2000),
          receivedAt: new Date(parseInt(full.data.internalDate, 10)),
        });
      }
    } else {
      console.log("📩 Fetching from IMAP");
      rawEmails = await fetchRecentEmails(req.user.emailAccount, 10);
    }

    const analyses = await batchAnalyzeEmails(rawEmails);

    const toSave = rawEmails.map((email, i) => {
      const ai = analyses[i] || {};

      return {
        userId: req.user._id,
        messageId: email.messageId,
        from: email.from,
        fromName: email.fromName,
        subject: email.subject,
        receivedAt: email.receivedAt,
        aiSummary: ai.summary || email.subject || "No summary",
        whatTheyWant: ai.whatTheyWant || "Check email",
        suggestedReplies: ai.suggestedReplies || ["OK", "Thanks"],
        category: ai.category || "noise",
      };
    });

    await EmailCache.insertMany(toSave, { ordered: false }).catch(() => {});

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

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

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

    const isGoogleConnected =
      !!req.user.google?.refreshToken || !!req.user.google?.accessToken;
    const isImapConnected = !!req.user.emailAccount?.connected;

    if (!isImapConnected && !isGoogleConnected) {
      return res.status(400).json({
        error: "No email connected. Connect IMAP or Google account.",
      });
    }

    const email = await EmailCache.findOne({
      _id: emailId,
      userId: req.user._id,
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (isGoogleConnected) {
      await sendEmailWithGmail(
        req.user,
        email.from,
        `Re: ${subject || email.subject}`,
        replyText,
      );
    } else {
      await sendEmail(
        req.user.emailAccount,
        email.from,
        `Re: ${subject || email.subject}`,
        replyText,
      );
    }

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
