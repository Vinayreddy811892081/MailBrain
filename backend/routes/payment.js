const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const generateReceipt = (userId) =>
  `mb_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`;

// -------------------- ROUTES -------------------- //

router.get("/status", auth, async (req, res) => {
  try {
    res.json({
      subscriptionStatus: req.user.subscriptionStatus,
      subscriptionActive: req.user.isSubscriptionActive(),
      daysLeft: req.user.getDaysLeft(),
      price: parseInt(process.env.SUBSCRIPTION_PRICE) || 99,
      currency: "INR",
      upiId: process.env.UPI_ID,
      upiName: process.env.UPI_NAME,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Create order
router.post("/create-order", auth, async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const amount = (parseInt(process.env.SUBSCRIPTION_PRICE) || 99) * 100; // paise

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
      orderId: order.id, // <-- matches frontend
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Verify payment
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Payment details missing" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ error: "Payment verification failed" });

    const subscriptionEnds = new Date(Date.now() + SUBSCRIPTION_DURATION);
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: "active",
      subscriptionEnds,
      lastPaymentId: razorpay_payment_id,
    });

    res.json({ success: true, subscriptionEnds, daysLeft: 30 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment verification error" });
  }
});

// Confirm UPI payment
router.post("/confirm-upi", auth, async (req, res) => {
  try {
    const { utrNumber } = req.body;
    if (!utrNumber || utrNumber.length < 10) {
      return res.status(400).json({ error: "Valid UTR number required" });
    }

    const subscriptionEnds = new Date(Date.now() + SUBSCRIPTION_DURATION);
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: "active",
      subscriptionEnds,
      lastPaymentId: `UPI_${utrNumber}`,
    });

    res.json({ success: true, subscriptionEnds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "UPI confirmation failed" });
  }
});

module.exports = router;
