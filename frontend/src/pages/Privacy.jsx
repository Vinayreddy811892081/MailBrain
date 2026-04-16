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
          <p style={textStyle}>
            MailBrain is an AI-powered email assistant that helps users connect
            their email accounts, view categorized inbox messages, generate
            summaries, and draft or send replies.
          </p>

          <p style={textStyle}>
            MailBrain only accesses Gmail data after the user has explicitly
            granted permission through Google&apos;s OAuth consent flow.
          </p>

          <p style={textStyle}>
            Google user data is used only to provide core application
            functionality such as fetching emails, generating summaries,
            categorizing messages, suggesting replies, and sending replies when
            the user explicitly requests it.
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
              MailBrain does not use Google user data for any purpose unrelated
              to MailBrain&apos;s core email-assistant functionality.
            </li>
            <li>
              MailBrain does not send emails automatically without explicit user
              action.
            </li>
            <li>
              MailBrain does not use Google user data to train generalized AI or
              machine learning models.
            </li>
          </ul>
        </Section>

        <Section title="4. Data protection and security">
          <p style={textStyle}>
            MailBrain uses industry-standard security measures to protect user
            data. Communication with external services, including Gmail APIs, is
            encrypted using HTTPS.
          </p>
          <p style={textStyle}>
            MailBrain limits access to authorized systems and processes only,
            and sensitive Google user data is handled only as needed to provide
            the requested email assistant features.
          </p>

          <p style={textStyle}>
            Access tokens and connected-account credentials are handled securely
            and used only for authorized API requests required to provide core
            MailBrain functionality.
          </p>

          <p style={textStyle}>
            MailBrain does not share, sell, or transfer Google user data to
            third parties for advertising or unrelated purposes.
          </p>
        </Section>

        <Section title="5. Data retention and deletion">
          <p style={textStyle}>
            MailBrain minimizes data storage. Email content is processed
            temporarily to generate summaries, categorization, and reply
            suggestions.
          </p>

          <ul style={listStyle}>
            <li>
              Raw email content is not permanently stored on MailBrain servers.
            </li>
            <li>
              Limited metadata and AI-generated summaries may be temporarily
              cached to improve performance.
            </li>
            <li>
              Cached summaries and related metadata are typically retained for
              less than 24 hours unless a shorter deletion event occurs first.
            </li>
            <li>
              When a user disconnects their Gmail account, associated connected
              account data and cached email data are deleted from MailBrain.
            </li>
          </ul>
        </Section>

        <Section title="6. User control">
          <ul style={listStyle}>
            <li>Users choose whether to connect Gmail.</li>
            <li>Users can disconnect Gmail at any time.</li>
            <li>Users choose whether to send a reply.</li>
          </ul>
        </Section>

        <Section title="7. Third-party services">
          <p style={textStyle}>
            MailBrain may use secure third-party infrastructure and AI providers
            to process authorized email data for summaries and reply assistance.
            These services are used only to operate MailBrain&apos;s core
            features.
          </p>
        </Section>

        <Section title="8. Compliance with Google API Services User Data Policy">
          <p style={textStyle}>
            MailBrain complies with the Google API Services User Data Policy.
            Google user data is only used to provide and improve core
            application functionality such as email summarization,
            categorization, and user-requested reply assistance.
          </p>
        </Section>

        <Section title="9. Contact">
          <p style={textStyle}>
            If you have questions about this Privacy Policy or MailBrain&apos;s
            data practices, contact:
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
