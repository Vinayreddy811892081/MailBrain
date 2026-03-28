// pages/Payment.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, CreditCard, CheckCircle, ArrowRight } from "lucide-react";
import { paymentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Payment.css";

export default function Payment() {
  const [payStatus, setPayStatus] = useState(null);
  const [tab, setTab] = useState("razorpay");
  const [utrNumber, setUtrNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { token, refreshUser, daysLeft, subscriptionActive } = useAuth();
  const navigate = useNavigate();

  // Fetch subscription/payment status
  useEffect(() => {
    paymentAPI
      .status()
      .then((res) => setPayStatus(res.data))
      .catch((err) => console.error("Status fetch error:", err));
  }, []);

  // Handle Razorpay payment
  const handlePayment = async () => {
    if (!token) {
      toast.error("Please login to proceed with payment.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const { data } = await paymentAPI.createOrder();
      console.log("Order response:", data);

      if (!data.orderId || !data.amount || !data.currency) {
        throw new Error("Invalid order from server");
      }
      if (!data.keyId) {
        throw new Error("Razorpay keyId is missing from server response");
      }

      // Convert amount to number, ensure currency is uppercase
      const amount = Number(data.amount);
      const currency = String(data.currency).toUpperCase();

      const options = {
        key: data.keyId, // Razorpay key
        amount: data.amount, // in paise
        currency: "INR",
        name: "MailBrain",
        description: "Subscription Payment",
        order_id: data.orderId, // must match backend
        handler: async function (response) {
          try {
            const verifyRes = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful! Subscription activated.");
              await refreshUser();
              navigate("/app");
            } else {
              toast.error(
                verifyRes.data.error || "Payment verification failed",
              );
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment verification error");
          }
        },
        prefill: {
          name: data.userName || "",
          email: data.userEmail || "",
        },
        theme: { color: "#6c63ff" },
      };

      if (!window.Razorpay) {
        toast.error("Razorpay SDK not loaded. Refresh page and try again.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error("Could not initiate payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual UPI confirmation
  const handleUpiConfirm = async () => {
    if (utrNumber.trim().length < 10) {
      toast.error("Enter a valid UTR number (12 digits)");
      return;
    }
    setLoading(true);
    try {
      await paymentAPI.confirmUpi({
        utrNumber: utrNumber.trim(),
        screenshotNote: "",
      });
      await refreshUser();
      toast.success("✅ Payment confirmed! Subscription active.");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.error || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  // Copy UPI ID to clipboard
  const copyUpi = () => {
    navigator.clipboard.writeText(payStatus?.upiId || "");
    toast.success("UPI ID copied!");
  };

  // Close modal / navigate back
  const handleClose = async () => {
    await refreshUser();
    navigate("/app");
  };

  return (
    <div className="pay-page">
      <div className="pay-card fade-in">
        <div className="pay-header">
          <div className="modal-header">
            <h3>Plan Details</h3>
            <button className="icon-btn" onClick={handleClose}>
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
              onClick={handlePayment}
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
