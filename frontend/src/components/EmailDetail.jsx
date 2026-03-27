// components/EmailDetail.jsx
import { useState } from 'react';
import { X, Send, Sparkles, Edit3, Check, ChevronDown } from 'lucide-react';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';
import './EmailDetail.css';

export default function EmailDetail({ email, onClose, onReplySent }) {
  const [replyText, setReplyText] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const pickReply = (text) => setReplyText(text);

  const generateCustom = async () => {
    if (!customInstruction.trim()) { toast.error('Describe what you want to say'); return; }
    setGenerating(true);
    try {
      const res = await emailAPI.generateReply({ emailId: email._id, instruction: customInstruction });
      setReplyText(res.data.reply);
      toast.success('Reply drafted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) { toast.error('Write a reply first'); return; }
    setSending(true);
    try {
      await emailAPI.sendReply({ emailId: email._id, replyText, subject: email.subject });
      toast.success('Reply sent! ✉️');
      onReplySent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const date = new Date(email.receivedAt);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' at ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="detail-container fade-in">
      {/* Header */}
      <div className="detail-header">
        <div>
          <h3 className="detail-from">{email.fromName || email.from}</h3>
          <div className="detail-meta">{email.subject}</div>
          <div className="detail-meta" style={{ fontSize: 11 }}>{dateStr}</div>
        </div>
        <div className="detail-header-actions">
          <span className={`tag tag-${email.category}`}>{email.category}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      <div className="detail-body">
        {/* AI Summary */}
        <div className="detail-section">
          <div className="section-label"><Sparkles size={12} /> AI SUMMARY</div>
          <div className="section-block">{email.aiSummary}</div>
        </div>

        {/* What they want */}
        {email.whatTheyWant && (
          <div className="detail-section">
            <div className="section-label">WHAT THEY WANT</div>
            <div className="section-block">{email.whatTheyWant}</div>
          </div>
        )}

        {/* Suggested replies */}
        {email.suggestedReplies?.length > 0 && (
          <div className="detail-section">
            <div className="section-label">REPLY WITH BOT HELP</div>
            <div className="suggested-replies">
              {email.suggestedReplies.map((r, i) => (
                <button
                  key={i}
                  className={`reply-opt ${replyText === r ? 'selected' : ''}`}
                  onClick={() => pickReply(r)}
                >
                  {replyText === r && <Check size={12} />}
                  {r}
                </button>
              ))}
            </div>

            {/* Custom instruction */}
            <button className="custom-toggle" onClick={() => setShowCustom(p => !p)}>
              <Edit3 size={13} /> Write custom reply
              <ChevronDown size={13} className={showCustom ? 'rotate' : ''} />
            </button>

            {showCustom && (
              <div className="custom-reply fade-in">
                <input
                  className="input"
                  placeholder="e.g. Decline politely, say I'm busy this week"
                  value={customInstruction}
                  onChange={e => setCustomInstruction(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateCustom()}
                />
                <button className="btn btn-ghost" onClick={generateCustom} disabled={generating}>
                  {generating ? <span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Sparkles size={13} />}
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reply editor */}
        {replyText && (
          <div className="detail-section reply-editor fade-in">
            <div className="section-label">YOUR REPLY</div>
            <textarea
              className="reply-textarea"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={6}
              placeholder="Edit your reply..."
            />
            <div className="reply-actions">
              <button className="btn btn-ghost" onClick={() => setReplyText('')}>Clear</button>
              <button className="btn btn-primary" onClick={sendReply} disabled={sending}>
                {sending
                  ? <><span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }} /> Sending...</>
                  : <><Send size={14} /> Edit and send</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
