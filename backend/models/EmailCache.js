// models/EmailCache.js
// PRIVACY NOTE: We store ONLY AI-generated summaries, not original email content.
// Raw email content is fetched live from IMAP, processed by AI, then discarded.
// Nothing from Gmail/Outlook servers is permanently stored.

const mongoose = require('mongoose');

const emailCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messageId: { type: String, required: true },
  
  // Only metadata - no raw body stored
  from: String,
  fromName: String,
  subject: String,
  receivedAt: Date,
  
  // AI-generated summaries only (not original email text)
  aiSummary: String,
  whatTheyWant: String,
  suggestedReplies: [String],
  category: {
    type: String,
    enum: ['urgent', 'jobs', 'bills', 'company', 'unreplied', 'noise'],
    default: 'noise'
  },
  isRead: { type: Boolean, default: false },
  isReplied: { type: Boolean, default: false },
  
  // Cache expiry - summaries auto-delete after 24 hours
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  },
  
  createdAt: { type: Date, default: Date.now }
});

emailCacheSchema.index({ userId: 1, receivedAt: -1 });
emailCacheSchema.index({ userId: 1, category: 1 });
emailCacheSchema.index({ userId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('EmailCache', emailCacheSchema);
