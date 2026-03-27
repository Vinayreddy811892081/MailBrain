// routes/payment.js
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Initialize Razorpay instance
const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// Helper: generate unique receipt
const generateReceipt = (userId) => {
  return `mb_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;
};

// Subscription duration in milliseconds (30 days)
const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60 * 1000;

// -------------------- ROUTES -------------------- //

// Get subscription status and UPI details
router.get("/status", auth, async (req, res) => {
  try {
    res.json({
      subscriptionStatus: req.user.subscriptionStatus,
      subscriptionActive: req.user.isSubscriptionActive(),
      daysLeft: req.user.getDaysLeft(),
      trialEnds: req.user.trialEnds,
      subscriptionEnds: req.user.subscriptionEnds,
      price: parseInt(process.env.SUBSCRIPTION_PRICE) || 99,
      currency: "INR",
      upiId: process.env.UPI_ID,
      upiName: process.env.UPI_NAME,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Create Razorpay order (UPI/card payment)
router.post("/create-order", auth, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const amount = parseInt(process.env.SUBSCRIPTION_PRICE) || 9900; // in paise

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: generateReceipt(req.user._id),
      notes: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        plan: "monthly",
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Verify Razorpay payment and activate subscription
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Payment details missing" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const subscriptionEnds = new Date(Date.now() + SUBSCRIPTION_DURATION);
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: "active",
      subscriptionEnds,
      lastPaymentId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: "Subscription activated!",
      subscriptionEnds,
      daysLeft: 30,
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Payment verification error" });
  }
});

// Manual UPI payment confirmation
router.post("/confirm-upi", auth, async (req, res) => {
  try {
    const { utrNumber, screenshotNote } = req.body;

    if (!utrNumber || utrNumber.length < 10) {
      return res.status(400).json({ error: "Valid UTR number required" });
    }

    const subscriptionEnds = new Date(Date.now() + SUBSCRIPTION_DURATION);
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: "active",
      subscriptionEnds,
      lastPaymentId: `UPI_${utrNumber}`,
    });

    res.json({
      success: true,
      message: "Payment confirmed! Subscription activated for 30 days.",
      subscriptionEnds,
    });
  } catch (err) {
    console.error("UPI confirmation error:", err);
    res.status(500).json({ error: "Confirmation failed" });
  }
});

// Razorpay webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const body = req.body.toString(); // convert buffer to string

      const expectedSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (signature !== expectedSig)
        return res.status(400).send("Invalid signature");

      const event = JSON.parse(body);

      if (event.event === "payment.captured") {
        const notes = event.payload.payment.entity.notes;
        if (notes?.userId) {
          const subscriptionEnds = new Date(Date.now() + SUBSCRIPTION_DURATION);
          await User.findByIdAndUpdate(notes.userId, {
            subscriptionStatus: "active",
            subscriptionEnds,
            lastPaymentId: event.payload.payment.entity.id,
          });
        }
      }

      res.json({ status: "ok" });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).send("Webhook error");
    }
  },
);

module.exports = router;
