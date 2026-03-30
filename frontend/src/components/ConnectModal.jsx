import { useState } from "react";
import { X, Eye, EyeOff, Shield } from "lucide-react";
import { emailAPI } from "../services/api";
import toast from "react-hot-toast";
import "./ConnectModal.css";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ConnectModal({ onClose, onConnected }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const handleGoogleConnect = () => {
    const token = localStorage.getItem("mb_token");

    if (!token) {
      toast.error("Please login first");
      return;
    }

    window.location.href = `${BACKEND_URL}/api/auth/google?token=${token}`;
  };

  const handleConnect = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }

    setLoading(true);
    try {
      await emailAPI.connect({ email, password });
      toast.success("Email connected successfully");
      onConnected();
    } catch (err) {
      toast.error(err.response?.data?.error || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Connect your email</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "14px",
            marginBottom: "10px",
          }}
          onClick={handleGoogleConnect}
        >
          🚀 Connect Gmail (Recommended)
        </button>

        <p style={{ fontSize: 12, textAlign: "center", opacity: 0.7 }}>
          Connect your Gmail securely with Google
        </p>

        <div style={{ textAlign: "center", margin: "10px 0" }}>
          <button
            type="button"
            className="link-btn"
            onClick={() => setShowManual((p) => !p)}
          >
            {showManual ? "Hide manual setup" : "Use manual IMAP instead"}
          </button>
        </div>

        {showManual && (
          <>
            <div className="connect-privacy">
              <Shield size={14} color="#4dffb8" />
              <p>
                Your credentials are used only for IMAP access. Raw emails are
                never stored — only AI summaries.
              </p>
            </div>

            <form
              onSubmit={handleConnect}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div className="field">
                <label>Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Password / App Password</label>
                <div className="pass-wrap">
                  <input
                    className="input"
                    type={showPass ? "text" : "password"}
                    placeholder="Your email password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={() => setShowPass((p) => !p)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ justifyContent: "center", padding: "13px" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loader" /> Connecting...
                  </>
                ) : (
                  "Connect Email"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
