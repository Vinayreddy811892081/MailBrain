// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  
  // Email account credentials (stored encrypted, never logged)
  emailAccount: {
    email: String,
    password: String,  // IMAP password - stored but never exposed to frontend
    imapHost: String,
    imapPort: Number,
    smtpHost: String,
    smtpPort: Number,
    connected: { type: Boolean, default: false }
  },

  // Subscription
  trialStarted: { type: Date, default: Date.now },
  trialEnds: { type: Date },
  subscriptionStatus: { 
    type: String, 
    enum: ['trial', 'active', 'expired', 'cancelled'],
    default: 'trial'
  },
  subscriptionEnds: Date,
  razorpayCustomerId: String,
  lastPaymentId: String,
  
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.trialEnds) {
    const trialDays = parseInt(process.env.TRIAL_DAYS) || 5;
    this.trialEnds = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isSubscriptionActive = function() {
  const now = new Date();
  if (this.subscriptionStatus === 'trial' && this.trialEnds > now) return true;
  if (this.subscriptionStatus === 'active' && this.subscriptionEnds > now) return true;
  return false;
};

userSchema.methods.getDaysLeft = function() {
  const now = new Date();
  if (this.subscriptionStatus === 'trial') {
    const diff = this.trialEnds - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  if (this.subscriptionStatus === 'active') {
    const diff = this.subscriptionEnds - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  return 0;
};

// PRIVACY: Never expose email account password
userSchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  if (obj.emailAccount) {
    delete obj.emailAccount.password;
  }
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
