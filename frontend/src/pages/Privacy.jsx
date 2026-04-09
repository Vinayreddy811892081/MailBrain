export default function Privacy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow)",
        }}
      >
        <a
          href="/"
          style={{
            display: "inline-block",
            marginBottom: "14px",
            color: "var(--text2)",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          ← Back to MailBrain
        </a>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "var(--accent-glow)",
              color: "var(--accent2)",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "14px",
            }}
          >
            MailBrain · Privacy Policy
          </div>

          <h1
            style={{
              fontSize: "36px",
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            Privacy Policy
          </h1>

          <p style={{ color: "var(--text2)", fontSize: "15px" }}>
            Effective date: April 2026 · Last updated: April 2026
          </p>
        </div>

        <section style={{ marginBottom: "24px" }}>
          <p style={{ color: "var(--text2)", lineHeight: 1.8 }}>
            MailBrain is an AI-powered email assistant that helps users connect
            their email accounts, view categorized inbox messages, generate
            summaries, and draft or send replies. This Privacy Policy explains
            what data we access, how we use it, and what choices users have.
          </p>
          <p style={textStyle}>
            MailBrain only accesses Gmail data after the user has explicitly
            granted permission through Google's OAuth consent flow.
          </p>
        </section>

        <Section title="1. What data MailBrain accesses">
          <ul style={listStyle}>
            <li>
              Gmail account email address, after the user explicitly connects
              Gmail through Google OAuth.
            </li>
            <li>
              Email metadata such as sender, recipient, subject, timestamp, and
              message identifiers.
            </li>
            <li>
              Email content needed to generate summaries, categorization, and
              reply suggestions.
            </li>
          </ul>
        </Section>

        <Section title="2. How MailBrain uses this data">
          <ul style={listStyle}>
            <li>Fetch inbox emails requested by the user.</li>
            <li>Generate AI-powered summaries and classify emails.</li>
            <li>Suggest reply drafts for the user to review.</li>
            <li>
              Send replies only when the user explicitly chooses to send them.
            </li>
          </ul>
        </Section>

        <Section title="3. What MailBrain does not do">
          <ul style={listStyle}>
            <li>MailBrain does not sell Gmail data.</li>
            <li>MailBrain does not use Gmail data for advertising.</li>
            <li>
              MailBrain does not send emails automatically without explicit user
              action.
            </li>
            <li>
              MailBrain does not permanently store raw email content unless
              strictly required for temporary app functionality.
            </li>
          </ul>
        </Section>

        <Section title="4. Data storage and retention">
          <p style={textStyle}>
            MailBrain aims to minimize stored data. Raw email content is
            processed for summaries and reply assistance. Limited metadata and
            AI-generated summaries may be temporarily cached to improve
            performance. Users can disconnect their account, which removes
            connected-account data and cached email data associated with the
            app.
          </p>
        </Section>

        <Section title="5. User control">
          <ul style={listStyle}>
            <li>Users choose whether to connect Gmail.</li>
            <li>Users can disconnect Gmail at any time.</li>
            <li>Users choose whether to send a reply.</li>
          </ul>
        </Section>

        <Section title="6. Third-party services">
          <p style={textStyle}>
            MailBrain may use secure third-party infrastructure and AI providers
            to process authorized email data for summaries and reply assistance.
            These services are used only to operate core MailBrain features.
          </p>
        </Section>

        <Section title="7. Contact">
          <p style={textStyle}>
            If you have questions about this Privacy Policy or MailBrain’s data
            practices, contact:
          </p>
          <p style={{ ...textStyle, fontWeight: 600 }}>
            vinayreddy0056@gmail.com
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "26px" }}>
      <h2
        style={{
          fontSize: "20px",
          marginBottom: "10px",
          color: "var(--text)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

const textStyle = {
  color: "var(--text2)",
  lineHeight: 1.8,
  fontSize: "15px",
};

const listStyle = {
  color: "var(--text2)",
  lineHeight: 1.8,
  fontSize: "15px",
  paddingLeft: "20px",
};
