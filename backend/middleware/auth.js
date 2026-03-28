// middleware/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireSubscription = async (req, res, next) => {
  if (!req.user.isSubscriptionActive()) {
    return res.status(403).json({
      error: "Subscription expired",
      code: "SUBSCRIPTION_EXPIRED",
      trialEnded: true,
    });
  }
  next();
};

module.exports = { auth, requireSubscription };
