// services/imapService.js
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Auto-detect IMAP settings for common providers
const detectImapSettings = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  const providers = {
    'gmail.com': { host: 'imap.gmail.com', port: 993, smtpHost: 'smtp.gmail.com', smtpPort: 587 },
    'googlemail.com': { host: 'imap.gmail.com', port: 993, smtpHost: 'smtp.gmail.com', smtpPort: 587 },
    'outlook.com': { host: 'outlook.office365.com', port: 993, smtpHost: 'smtp.office365.com', smtpPort: 587 },
    'hotmail.com': { host: 'outlook.office365.com', port: 993, smtpHost: 'smtp.office365.com', smtpPort: 587 },
    'live.com': { host: 'outlook.office365.com', port: 993, smtpHost: 'smtp.office365.com', smtpPort: 587 },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587 },
    'yahoo.in': { host: 'imap.mail.yahoo.com', port: 993, smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587 },
    'icloud.com': { host: 'imap.mail.me.com', port: 993, smtpHost: 'smtp.mail.me.com', smtpPort: 587 },
    'me.com': { host: 'imap.mail.me.com', port: 993, smtpHost: 'smtp.mail.me.com', smtpPort: 587 },
    'protonmail.com': { host: '127.0.0.1', port: 1143, smtpHost: '127.0.0.1', smtpPort: 1025 },
    'zoho.com': { host: 'imap.zoho.in', port: 993, smtpHost: 'smtp.zoho.in', smtpPort: 587 },
    'rediffmail.com': { host: 'imap.rediffmail.com', port: 993, smtpHost: 'smtp.rediffmail.com', smtpPort: 587 },
  };
  return providers[domain] || { host: `imap.${domain}`, port: 993, smtpHost: `smtp.${domain}`, smtpPort: 587 };
};

// Test IMAP connection
const testConnection = (emailConfig) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: emailConfig.email,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 15000
    });

    imap.once('ready', () => {
      imap.end();
      resolve(true);
    });
    imap.once('error', (err) => reject(err));
    imap.connect();
  });
};

// Fetch recent emails from INBOX (live fetch, raw content never stored)
const fetchRecentEmails = (emailConfig, limit = 30) => {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: emailConfig.email,
      password: emailConfig.password,
      host: emailConfig.imapHost,
      port: emailConfig.imapPort || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000,
      connTimeout: 20000
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { imap.end(); return reject(err); }

        const total = box.messages.total;
        if (total === 0) { imap.end(); return resolve([]); }

        const start = Math.max(1, total - limit + 1);
        const fetch = imap.seq.fetch(`${start}:${total}`, {
          bodies: ['HEADER', 'TEXT', ''],
          struct: true
        });

        fetch.on('message', (msg) => {
          let buffer = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
          });
          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(buffer);
              emails.push({
                messageId: parsed.messageId || `msg_${Date.now()}_${Math.random()}`,
                from: parsed.from?.value?.[0]?.address || '',
                fromName: parsed.from?.value?.[0]?.name || '',
                subject: parsed.subject || '(no subject)',
                // Only pass text to AI - never store it
                bodyText: (parsed.text || '').substring(0, 2000),
                receivedAt: parsed.date || new Date(),
              });
            } catch (e) { /* skip malformed */ }
          });
        });

        fetch.once('end', () => {
          imap.end();
          resolve(emails.reverse()); // newest first
        });

        fetch.once('error', (err) => { imap.end(); reject(err); });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
};

// Send email via SMTP (nodemailer)
const sendEmail = async (emailConfig, to, subject, text, html) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort || 587,
    secure: false,
    auth: { user: emailConfig.email, pass: emailConfig.password },
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from: `"${emailConfig.name || 'Me'}" <${emailConfig.email}>`,
    to, subject, text, html: html || `<p>${text}</p>`
  });
};

module.exports = { detectImapSettings, testConnection, fetchRecentEmails, sendEmail };
