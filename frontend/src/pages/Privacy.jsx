export default function Privacy() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        lineHeight: 1.7,
      }}
    >
      <h1>Privacy Policy</h1>

      <p>
        MailBrain is an AI email assistant that helps users summarize emails,
        categorize messages, and draft replies.
      </p>

      <h2>What data we access</h2>
      <p>
        When you connect your Gmail account, MailBrain may access email metadata
        and message content only to provide summaries, categorization, and reply
        assistance.
      </p>

      <h2>How we use data</h2>
      <ul>
        <li>Fetch inbox emails</li>
        <li>Generate AI summaries</li>
        <li>Suggest replies</li>
        <li>Send replies only when you explicitly choose to send them</li>
      </ul>

      <h2>Data storage</h2>
      <p>
        MailBrain does not permanently store raw email content. Only limited
        metadata and AI-generated summaries may be temporarily cached to improve
        performance.
      </p>

      <h2>Data sharing</h2>
      <p>MailBrain does not sell or share your Gmail data for advertising.</p>

      <h2>Disconnecting</h2>
      <p>
        Users can disconnect their Gmail account at any time, which removes
        stored connected-account data.
      </p>

      <h2>Contact</h2>
      <p>For questions, contact: vinayreddy0056@gmail.com</p>
    </div>
  );
}
