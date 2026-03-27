// pages/App.jsx — Main Dashboard
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  RefreshCw,
  LogOut,
  Settings,
  Mail,
  X,
  Send,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { emailAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConnectModal from "../components/ConnectModal";
import EmailDetail from "../components/EmailDetail";
import toast from "react-hot-toast";
import "./App.css";

const CATEGORIES = [
  { key: "all", label: "All Mail", color: "#9090a8" },
  { key: "urgent", label: "Urgent", color: "#ff4d6a" },
  { key: "jobs", label: "Jobs", color: "#4d9fff" },
  { key: "bills", label: "Bills", color: "#ffb84d" },
  { key: "company", label: "Company", color: "#a64dff" },
  { key: "unreplied", label: "Unreplied", color: "#4dffb8" },
  { key: "noise", label: "Noise", color: "#5a5a70" },
];

export default function AppPage() {
  const { user, logout, subscriptionActive, daysLeft } = useAuth();
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("urgent");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [connected, setConnected] = useState(!!user?.emailAccount?.connected);

  useEffect(() => {
    const skipPayment = sessionStorage.getItem("skipPayment");

    if (!subscriptionActive && daysLeft <= 0 && !skipPayment) {
      navigate("/payment");
    }

    // clear after use
    sessionStorage.removeItem("skipPayment");
  }, [subscriptionActive, daysLeft]);

  const fetchEmails = useCallback(
    async (refresh = false) => {
      setLoading(true);
      try {
        const res = await emailAPI.fetch({
          category: selectedCategory === "all" ? undefined : selectedCategory,
          refresh: refresh ? "1" : undefined,
        });
        setEmails(res.data.emails || []);
        if (!res.data.fromCache || refresh) fetchCounts();
      } catch (err) {
        if (err.response?.data?.code === "NOT_CONNECTED") {
          setConnected(false);
        } else {
          toast.error(err.response?.data?.error || "Failed to fetch emails");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory],
  );

  const fetchCounts = async () => {
    try {
      const res = await emailAPI.categories();
      setCounts(res.data);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleConnected = () => {
    setConnected(true);
    setShowConnect(false);
    toast.success("Email connected! Analyzing your inbox...");
    setTimeout(() => fetchEmails(true), 500);
  };

  const handleDisconnect = async () => {
    try {
      await emailAPI.disconnect();
      setConnected(false);
      setEmails([]);
      setCounts({});
      setSelectedEmail(null);
      toast.success("Email disconnected. All cached data deleted.");
    } catch {
      toast.error("Disconnect failed");
    }
    setShowSettings(false);
  };

  const filteredEmails = emails.filter(
    (e) => selectedCategory === "all" || e.category === selectedCategory,
  );

  const categoryCount = (key) => {
    if (key === "all") return Object.values(counts).reduce((a, b) => a + b, 0);
    return counts[key] || 0;
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brain size={22} color="#6c63ff" />
          <span>MailBrain</span>
        </div>

        {daysLeft > 0 && daysLeft <= 5 && (
          <div className="trial-banner">
            <AlertCircle size={13} />
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
            <button onClick={() => navigate("/payment")}>Upgrade</button>
          </div>
        )}

        <nav className="sidebar-nav">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`cat-item ${selectedCategory === cat.key ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSelectedEmail(null);
              }}
            >
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-label">{cat.label}</span>
              {categoryCount(cat.key) > 0 && (
                <span className="cat-count">{categoryCount(cat.key)}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="connect-status"
            onClick={() =>
              connected ? setShowSettings(true) : setShowConnect(true)
            }
          >
            {connected ? (
              <>
                <Wifi size={14} color="#4dffb8" /> <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={14} color="#ff4d6a" /> <span>Connect email</span>
              </>
            )}
            <ChevronRight size={14} className="chevron" />
          </div>
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Email list */}
      <main className="email-list-panel">
        <div className="panel-header">
          <div>
            <h2>{CATEGORIES.find((c) => c.key === selectedCategory)?.label}</h2>
            <p>
              {filteredEmails.length} email
              {filteredEmails.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="panel-actions">
            {connected && (
              <button
                className="icon-btn"
                onClick={() => fetchEmails(true)}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw size={16} className={loading ? "spin" : ""} />
              </button>
            )}
            {!connected && (
              <button
                className="btn btn-primary"
                onClick={() => setShowConnect(true)}
              >
                + Connect Email
              </button>
            )}
          </div>
        </div>

        {!connected && (
          <div className="empty-state">
            <Mail size={48} color="#3a3a45" />
            <h3>Connect your email</h3>
            <p>
              Link your Gmail, Outlook, or any email via IMAP to get started.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowConnect(true)}
            >
              Connect Email
            </button>
          </div>
        )}

        {connected && loading && emails.length === 0 && (
          <div className="loading-state">
            <div className="loader" style={{ width: 32, height: 32 }} />
            <p>Fetching and analyzing your emails...</p>
          </div>
        )}

        {connected && !loading && filteredEmails.length === 0 && (
          <div className="empty-state">
            <Sparkles size={40} color="#3a3a45" />
            <h3>All clear!</h3>
            <p>No emails in this category.</p>
          </div>
        )}

        <div className="email-list">
          {filteredEmails.map((email) => (
            <EmailCard
              key={email._id || email.messageId}
              email={email}
              selected={selectedEmail?._id === email._id}
              onClick={() => {
                setSelectedEmail(email);
                if (!email.isRead) emailAPI.markRead(email._id).catch(() => {});
              }}
            />
          ))}
        </div>
      </main>

      {/* Email detail panel */}
      <section className="detail-panel">
        {selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onReplySent={() => {
              setSelectedEmail(null);
              fetchEmails(true);
            }}
          />
        ) : (
          <div className="detail-empty">
            <Mail size={48} color="#2a2a33" />
            <p>Click an email to read summary and reply</p>
          </div>
        )}
      </section>

      {/* Modals */}
      {showConnect && (
        <ConnectModal
          onClose={() => setShowConnect(false)}
          onConnected={handleConnected}
        />
      )}
      {showSettings && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onDisconnect={handleDisconnect}
          onUpgrade={() => {
            setShowSettings(false);
            navigate("/payment");
          }}
          daysLeft={daysLeft}
          subscriptionActive={subscriptionActive}
        />
      )}
    </div>
  );
}

function EmailCard({ email, selected, onClick }) {
  const date = new Date(email.receivedAt);
  const isToday = new Date().toDateString() === date.toDateString();
  const timeStr = isToday
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div
      className={`email-card ${selected ? "selected" : ""} ${!email.isRead ? "unread" : ""}`}
      onClick={onClick}
    >
      <div className="ec-top">
        <span className="ec-from">{email.fromName || email.from}</span>
        <span className="ec-time">{timeStr}</span>
      </div>
      <div className="ec-subject">{email.subject}</div>
      <div className="ec-preview">{email.aiSummary}</div>
      <div className="ec-tags">
        <span className={`tag tag-${email.category}`}>{email.category}</span>
        {email.isReplied && (
          <span
            className="tag"
            style={{ background: "rgba(77,255,184,0.1)", color: "#4dffb8" }}
          >
            Replied
          </span>
        )}
      </div>
    </div>
  );
}

function SettingsModal({
  user,
  onClose,
  onDisconnect,
  onUpgrade,
  daysLeft,
  subscriptionActive,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="settings-section">
          <h4>Account</h4>
          <div className="settings-row">
            <span>Name</span>
            <span>{user?.name}</span>
          </div>
          <div className="settings-row">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
        </div>
        <div className="settings-section">
          <h4>Subscription</h4>
          <div className="settings-row">
            <span>Status</span>
            <span style={{ color: subscriptionActive ? "#4dffb8" : "#ff4d6a" }}>
              {subscriptionActive
                ? `Active · ${daysLeft} days left`
                : "Expired"}
            </span>
          </div>
          {!subscriptionActive || daysLeft <= 5 ? (
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
              onClick={onUpgrade}
            >
              {subscriptionActive
                ? "Renew — ₹99/month"
                : "Subscribe — ₹99/month"}
            </button>
          ) : null}
        </div>
        <div className="settings-section">
          <h4>Email Connection</h4>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
            Disconnecting removes all cached summaries from our servers. Raw
            emails were never stored.
          </p>
          <button
            className="btn btn-danger"
            onClick={onDisconnect}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Disconnect & Delete Cached Data
          </button>
        </div>
      </div>
    </div>
  );
}
