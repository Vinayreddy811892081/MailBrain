// pages/Auth.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user, res.data.subscriptionActive, res.data.daysLeft);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <Link to="/" className="auth-brand"><Brain size={22} color="#6c63ff" /> MailBrain</Link>
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Your password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="loader" /> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="auth-switch">No account? <Link to="/register">Start free trial</Link></p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be 8+ characters'); return; }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(res.data.token, res.data.user, true, res.data.trialDays);
      toast.success(`Welcome to MailBrain! ${res.data.trialDays} days free 🎉`);
      navigate('/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <Link to="/" className="auth-brand"><Brain size={22} color="#6c63ff" /> MailBrain</Link>
        <h2>Start your free trial</h2>
        <p className="auth-sub">5 days free · No credit card needed</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Full name</label>
            <input className="input" type="text" placeholder="Ravi Sharma" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="8+ characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="loader" /> : <>Create account <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
