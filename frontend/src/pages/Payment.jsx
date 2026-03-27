// pages/Payment.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  CreditCard,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Copy,
} from "lucide-react";
import { paymentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Payment.css";

export default function Payment() {
  const [payStatus, setPayStatus] = useState(null);
  const [tab, setTab] = useState("razorpay"); // 'razorpay' | 'upi'
  const [utrNumber, setUtrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, refreshUser, daysLeft, subscriptionActive } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    paymentAPI
      .status()
      .then((res) => setPayStatus(res.data))
      .catch(() => {});
  }, []);

  const handleRazorpay = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder();
      const { orderId, amount, keyId, userName, userEmail } = res.data;

      const options = {
        key: keyId,
        amount,
        currency: "INR",
        name: "MailBrain",
        description: "Monthly Subscription",
        order_id: orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#6c63ff" },
        handler: async (response) => {
          try {
            await paymentAPI.verify(response);
            await refreshUser();
            toast.success("🎉 Subscription activated!");
            navigate("/app");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: { ondismiss: () => toast.error("Payment cancelled") },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Could not initiate payment. Try UPI option.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpiConfirm = async () => {
    if (utrNumber.trim().length < 10) {
      toast.error("Enter a valid UTR number (12 digits)");
      return;
    }
    setLoading(true);
    try {
      await paymentAPI.confirmUpi({ utrNumber: utrNumber.trim() });
      await refreshUser();
      toast.success("✅ Payment confirmed! Subscription active.");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.error || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(payStatus?.upiId || "");
    toast.success("UPI ID copied!");
  };

  return (
    <div className="pay-page">
      <div className="pay-card fade-in">
        <div className="pay-header">
          <div className="modal-header">
            <h3>Plan Details</h3>
            <button
              className="icon-btn"
              onClick={() => {
                sessionStorage.setItem("skipPayment", "true");
                navigate("/app");
              }}
            >
              &times;
            </button>
          </div>
          <Brain size={28} color="#6c63ff" />
          <h1>MailBrain Pro</h1>
          <p>
            Your{" "}
            {subscriptionActive
              ? `trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
              : "trial has expired"}
            . Subscribe to continue.
          </p>
        </div>

        <div className="pay-price">
          <span className="pay-amount">₹99</span>
          <span className="pay-period">/month</span>
        </div>

        <ul className="pay-features">
          {[
            "Unlimited AI email summaries",
            "Smart categorization",
            "AI reply drafts",
            "Works with any email provider",
          ].map((f) => (
            <li key={f}>
              <CheckCircle size={14} color="#4dffb8" /> {f}
            </li>
          ))}
        </ul>

        {/* Tabs */}
        <div className="pay-tabs">
          <button
            className={`pay-tab ${tab === "razorpay" ? "active" : ""}`}
            onClick={() => setTab("razorpay")}
          >
            <CreditCard size={16} /> Card / UPI
          </button>
        </div>

        {tab === "razorpay" && (
          <div className="pay-section fade-in">
            <p className="pay-note">
              Pay securely via Razorpay — supports UPI, cards, netbanking
            </p>
            <button
              className="btn btn-primary pay-btn"
              onClick={handleRazorpay}
              disabled={loading}
            >
              {loading ? (
                <span className="loader" />
              ) : (
                <>
                  Pay ₹99 <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
        <p className="pay-footer-note">
          Questions? Email us at{" "}
          <a href="mailto:support@mailbrain.app">support@mailbrain.app</a>
        </p>
      </div>
    </div>
  );
}
