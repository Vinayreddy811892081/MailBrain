// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ 
      token, 
      user: user.toSafeJSON(),
      trialDays: parseInt(process.env.TRIAL_DAYS) || 5
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({ 
      token, 
      user: user.toSafeJSON(),
      subscriptionActive: user.isSubscriptionActive(),
      daysLeft: user.getDaysLeft()
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ 
    user: req.user.toSafeJSON(),
    subscriptionActive: req.user.isSubscriptionActive(),
    daysLeft: req.user.getDaysLeft(),
    subscriptionStatus: req.user.subscriptionStatus
  });
});

module.exports = router;
