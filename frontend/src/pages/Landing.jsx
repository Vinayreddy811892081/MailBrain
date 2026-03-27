// pages/Landing.jsx
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Zap,
  Shield,
  Mail,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="land-nav">
        <div className="brand">
          <Brain size={24} color="#6c63ff" />
          MailBrain
        </div>
        <div className="land-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>
            Log in
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/register")}
          >
            Start free — 5 days
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <Zap size={12} /> AI-powered · IMAP · No Gmail API needed
        </div>
        <h1 className="hero-title">
          Your inbox,
          <br />
          <span className="hero-gradient">finally intelligent</span>
        </h1>
        <p className="hero-sub">
          MailBrain reads your emails, summarizes what matters, and drafts
          replies — using IMAP, so it works with Gmail, Outlook, Yahoo, and any
          email. No OAuth, no Google approval.
        </p>
        <div className="hero-actions">
          <button
            className="btn btn-primary hero-cta"
            onClick={() => navigate("/register")}
          >
            Try free for 5 days <ArrowRight size={16} />
          </button>
          <p className="hero-note">₹99/month after trial · Cancel anytime</p>
        </div>

        {/* Mock UI */}
        <div className="hero-mockup">
          <div className="mock-sidebar">
            <div className="mock-brand">🧠 MailBrain</div>
            {[
              { dot: "#ff4d6a", label: "Urgent", count: 3 },
              { dot: "#4d9fff", label: "Jobs", count: 5 },
              { dot: "#ffb84d", label: "Bills", count: 4 },
              { dot: "#a64dff", label: "Company", count: 4 },
              { dot: "#4dffb8", label: "Unreplied", count: 7 },
              { dot: "#5a5a70", label: "Noise", count: 64 },
            ].map((item) => (
              <div key={item.label} className="mock-cat">
                <span className="mock-dot" style={{ background: item.dot }} />
                <span>{item.label}</span>
                <span className="mock-count">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mock-list">
            <div className="mock-email active">
              <div className="mock-from">Ravi Sharma (CEO)</div>
              <div className="mock-subject">Q3 deck review — urgent</div>
              <div className="mock-preview">
                CEO wants you to review and comment on the Q3...
              </div>
              <span className="tag tag-urgent">Urgent</span>
            </div>
            <div className="mock-email">
              <div className="mock-from">Priya (Client — Acme)</div>
              <div className="mock-subject">Follow-up on proposal</div>
              <div className="mock-preview">
                Client following up on a proposal sent 6 days ago...
              </div>
              <span className="tag tag-unreplied">Unreplied 6d</span>
            </div>
          </div>
          <div className="mock-detail">
            <div className="mock-detail-header">
              <div className="mock-detail-from">Ravi Sharma (CEO)</div>
              <div className="mock-detail-subject">Q3 deck review — urgent</div>
            </div>
            <div className="mock-section-label">AI SUMMARY</div>
            <div className="mock-section-text">
              CEO wants you to review and comment on the Q3 strategy deck before
              the board meeting at 3 PM today.
            </div>
            <div className="mock-section-label">WHAT THEY WANT</div>
            <div className="mock-section-text">
              Review the deck and send your comments by 2 PM.
            </div>
            <div className="mock-section-label">REPLY WITH BOT HELP</div>
            <div className="mock-reply-opt">
              I'll review and send comments by 1:30 PM
            </div>
            <div className="mock-reply-opt">
              Can we push to tomorrow? I'm in back-to-back calls
            </div>
            <div className="mock-reply-opt">
              On it — will share feedback within the hour
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        {[
          {
            icon: <Brain size={24} />,
            title: "AI Summaries",
            desc: 'Every email gets a 2-sentence summary and a "what they want" so you know exactly what to do.',
          },
          {
            icon: <Zap size={24} />,
            title: "Smart Categories",
            desc: "Urgent, Jobs, Bills, Company, Unreplied, Noise — your inbox sorted automatically.",
          },
          {
            icon: <Mail size={24} />,
            title: "AI Reply Drafts",
            desc: "Pick from 3 smart replies or write your own. MailBrain polishes it and sends.",
          },
          {
            icon: <Shield size={24} />,
            title: "Privacy First",
            desc: "Raw emails are never stored. Only AI-generated summaries cached for 24h, then auto-deleted.",
          },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="pricing">
        <h2>Simple pricing</h2>
        <div className="price-card">
          <div className="price-badge">Most popular</div>
          <div className="price-amount">
            ₹99<span>/month</span>
          </div>
          <div className="price-trial">
            5 days free · No card required to start
          </div>
          <ul className="price-features">
            {[
              "Unlimited email summaries",
              "Smart categorization",
              "AI reply drafts",
              "Works with any email provider",
              "Privacy-first — no raw email storage",
              "Send replies from MailBrain",
            ].map((f) => (
              <li key={f}>
                <CheckCircle size={16} color="#4dffb8" /> {f}
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
            onClick={() => navigate("/register")}
          >
            Start 5-day free trial <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="land-footer">
        <div className="brand">
          <Brain size={18} color="#6c63ff" /> MailBrain
        </div>
        <p>© 2024 MailBrain · Privacy-first AI email assistant</p>
      </footer>
    </div>
  );
}
