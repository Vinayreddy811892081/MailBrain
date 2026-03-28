// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Register
const bcrypt = require("bcryptjs");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be 8+ characters" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
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
    res.status(500).json({ error: err.message }); // 👈 show real error
  }
});

// Login
// 🔐 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📥 LOGIN REQUEST:", req.body);

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    console.log("👤 USER FOUND:", user ? "YES" : "NO");

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Debug passwords
    console.log("🔑 Entered Password:", password);
    console.log("🔐 Stored Hash:", user.password);

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("✅ Password Match:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log("🎉 LOGIN SUCCESS - Token generated");

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

// Get current user
router.get("/me", auth, async (req, res) => {
  res.json({
    user: req.user.toSafeJSON(),
    subscriptionActive: req.user.isSubscriptionActive(),
    daysLeft: req.user.getDaysLeft(),
    subscriptionStatus: req.user.subscriptionStatus,
  });
});

module.exports = router;
