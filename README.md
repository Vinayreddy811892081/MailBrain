# 🧠 MailBrain — AI Email Assistant

> IMAP-based AI email assistant. No Gmail API, no OAuth approval, works with any email.
> 5-day free trial → ₹99/month via Razorpay or direct UPI.

---

## 📁 Project Structure

```
mailbrain/
├── backend/          ← Node.js + Express API
│   ├── server.js
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── package.json
│   └── .env.example
│
└── frontend/         ← React + Vite
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── services/
    ├── index.html
    └── package.json
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Prerequisites (all free)

Install these if you haven't:

- **Node.js** v18+ → https://nodejs.org
- **MongoDB Atlas** (free) → https://mongodb.com/atlas (create a free M0 cluster)

---

### Step 2 — Get your API Keys

| Service          | Purpose     | Where to get                                                       |
| ---------------- | ----------- | ------------------------------------------------------------------ |
| MongoDB Atlas    | Database    | https://cloud.mongodb.com → Create cluster → Get connection string |
| Anthropic Claude | AI analysis | https://console.anthropic.com → API Keys                           |
| Razorpay         | Payments    | https://razorpay.com → Create account → Settings → API Keys        |

---

### Step 3 — Backend Setup

```bash
cd mailbrain/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/mailbrain
JWT_SECRET=any_long_random_string_here_make_it_32_chars
ANTHROPIC_API_KEY=sk-ant-...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
UPI_ID=yourname@paytm          # Your UPI ID for direct payments
UPI_NAME=Your Name
FRONTEND_URL=http://localhost:3000
SUBSCRIPTION_PRICE=9900       # 9900 paise = ₹99
TRIAL_DAYS=5
```

Start the backend:

```bash
npm run dev       # Development (with auto-reload)
# OR
npm start         # Production
```

Backend runs at: http://localhost:5000
Test it: http://localhost:5000/health

---

### Step 4 — Frontend Setup

```bash
cd mailbrain/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3000

---

### Step 5 — Gmail Setup for Users (App Password)

For users with Gmail accounts:

1. Go to **myaccount.google.com**
2. Security → 2-Step Verification (enable it)
3. Security → **App Passwords**
4. Select "Mail" → Generate
5. Use the 16-digit App Password in MailBrain (not their regular Gmail password)

For Outlook/Yahoo — similar App Password process in their account settings.

---

## 🗄️ Database Management

### View data (MongoDB Atlas dashboard)

Go to https://cloud.mongodb.com → Browse Collections

### Clear ALL cached email summaries (not user accounts)

```bash
# Connect to MongoDB shell or Atlas → run:
db.emailcaches.deleteMany({})
```

### Clear ALL user data (full reset)

```bash
db.users.deleteMany({})
db.emailcaches.deleteMany({})
```

### Delete a specific user

```bash
db.users.deleteOne({ email: "user@example.com" })
```

### Manually activate subscription for a user

```bash
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      subscriptionStatus: "active",
      subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }
)
```

### Email cache auto-deletes after 24 hours automatically (TTL index)

---

## 🔒 Privacy Architecture

**What is STORED in database:**

- User name, email, hashed password
- Email account IMAP host/port settings
- IMAP password (for connecting — stored because IMAP needs it)
- AI-generated summaries only (not raw email content)
- Summary cache expires automatically after 24 hours

**What is NEVER STORED:**

- Raw email body content
- Email attachments
- Complete email headers
- Any email metadata beyond sender/subject/date

**How it works:**

1. User triggers fetch → backend connects to IMAP live
2. Downloads emails temporarily in memory
3. Sends text snippets to Claude AI for analysis
4. Stores ONLY the AI summary + category
5. Raw email content is discarded from memory
6. 24-hour TTL means summaries auto-delete daily

---

## 💳 Payment Flow

### Option A: Razorpay (recommended)

- User clicks "Pay ₹99" → Razorpay modal opens
- Supports: UPI, credit/debit cards, netbanking
- Automatic subscription activation on payment

### Option B: Direct UPI

- User sends ₹99 to your UPI ID directly
- Enters UTR/transaction number
- Subscription activates immediately

### Going Live (Production Razorpay)

1. Complete KYC on Razorpay dashboard
2. Switch from test keys (`rzp_test_`) to live keys (`rzp_live_`)
3. Update `.env` with live keys

---

## 🌐 Deployment (Free)

### Backend → Railway.app (free tier)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
railway variables set PORT=5000 MONGO_URI=... (set all env vars)
```

### Frontend → Vercel (free)

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend
vercel deploy
```

Update `FRONTEND_URL` in backend `.env` with your Vercel URL.
Update `vite.config.js` proxy to point to your Railway backend URL.

---

## 🛠️ Tech Stack (all free)

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 18 + Vite                         |
| Backend  | Node.js + Express                       |
| Database | MongoDB Atlas (free M0)                 |
| AI       | Anthropic Claude Haiku (cheap)          |
| Email    | IMAP (imap package) + SMTP (nodemailer) |
| Auth     | JWT                                     |
| Payments | Razorpay                                |
| Hosting  | Railway + Vercel (free tiers)           |

---

## 🔧 API Endpoints

```
POST /api/auth/register        — Create account
POST /api/auth/login           — Login
GET  /api/auth/me              — Get current user

POST /api/emails/connect       — Connect email (IMAP)
POST /api/emails/disconnect    — Disconnect + delete cache
GET  /api/emails/fetch         — Fetch + analyze emails
GET  /api/emails/categories    — Get category counts
POST /api/emails/reply/generate — AI draft a reply
POST /api/emails/reply/send    — Send reply via SMTP
PATCH /api/emails/:id/read     — Mark as read

GET  /api/payment/status       — Subscription status
POST /api/payment/create-order — Create Razorpay order
POST /api/payment/verify       — Verify payment
POST /api/payment/confirm-upi  — Confirm direct UPI payment
POST /api/payment/webhook      — Razorpay webhook
```

---

## ❓ Troubleshooting

**Gmail connection fails:**
→ Use App Password, not regular Gmail password
→ Enable IMAP in Gmail Settings → Forwarding and POP/IMAP

**"Invalid credentials" for Outlook:**
→ Enable IMAP in Outlook: Settings → Mail → Sync email → Enable IMAP

**MongoDB connection fails:**
→ Whitelist your IP in Atlas: Network Access → Add IP → 0.0.0.0/0 (allow all)

**Razorpay payment not activating:**
→ Check webhook URL is set in Razorpay dashboard: https://yourdomain.com/api/payment/webhook

---

## 📞 Support

Email: support@mailbrain.app
