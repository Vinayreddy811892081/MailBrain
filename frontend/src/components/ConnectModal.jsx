// components/ConnectModal.jsx
import { useState } from 'react';
import { X, Eye, EyeOff, Info, Shield } from 'lucide-react';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';
import './ConnectModal.css';

const HINTS = {
  'gmail.com': 'Gmail: Enable IMAP in Gmail settings. Use an App Password (not your regular password). Get it at myaccount.google.com/apppasswords',
  'googlemail.com': 'Gmail: Use an App Password from myaccount.google.com/apppasswords',
  'outlook.com': 'Outlook: Enable IMAP in Outlook settings. Use your regular Microsoft password.',
  'hotmail.com': 'Hotmail: Enable IMAP in settings. Use your Microsoft account password.',
  'yahoo.com': 'Yahoo: Enable IMAP and create an App Password at login.yahoo.com/account/security',
  'yahoo.in': 'Yahoo: Enable IMAP and create an App Password at login.yahoo.com/account/security',
};

export default function ConnectModal({ onClose, onConnected }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const domain = email.split('@')[1]?.toLowerCase();
  const hint = HINTS[domain];

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      await emailAPI.connect({ email, password });
      onConnected();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Connect your email</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="connect-privacy">
          <Shield size={14} color="#4dffb8" />
          <p>Your credentials are used only for IMAP access. Raw emails are never stored — only AI summaries.</p>
        </div>

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>
              {domain && ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in'].includes(domain)
                ? 'App Password (not your regular password)'
                : 'Password'}
            </label>
            <div className="pass-wrap">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="Your email / app password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {hint && (
            <div className="connect-hint">
              <Info size={13} />
              <p>{hint}</p>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px' }} disabled={loading}>
            {loading ? <><span className="loader" /> Connecting...</> : 'Connect Email'}
          </button>
        </form>

        <div className="provider-list">
          <p>Works with</p>
          <div className="providers">
            {['Gmail', 'Outlook', 'Yahoo', 'iCloud', 'Zoho', 'Rediffmail', 'Any IMAP'].map(p => (
              <span key={p} className="provider-tag">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
