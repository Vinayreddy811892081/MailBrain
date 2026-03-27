const axios = require("axios");

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// ✅ SAFE AI CALL
const callAI = async (systemPrompt, userMessage) => {
  try {
    const res = await axios.post(
      GROQ_API,
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0, // ✅ more stable
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.data.choices?.[0]?.message?.content || "[]";
  } catch (err) {
    console.error("⚠️ AI ERROR:", err.response?.data || err.message);
    return "[]";
  }
};

// ✅ FINAL MAIN FUNCTION (PRODUCTION SAFE)
const batchAnalyzeEmails = async (emails = []) => {
  try {
    if (!emails.length) return [];

    // ✅ FIX 1: ALWAYS ADD ID
    const safeEmails = emails.map((e, i) => ({
      id: i.toString(),
      from: e.fromName || "",
      subject: e.subject || "",
      body: (e.bodyText || "").slice(0, 120),
    }));

    // ✅ FIX 2: JSON INPUT (VERY IMPORTANT)
    const userPrompt = JSON.stringify(safeEmails, null, 2);

    const systemPrompt = `
You are an email classifier.

STRICT RULES:
- Return ONLY valid JSON array
- NO explanation
- DO NOT change id
- Use ONLY these categories:
  urgent | jobs | bills | company | unreplied | noise

Rules:
- Job / Interview → jobs
- Payment / OTP / security → urgent
- Google/system alerts → company
- Unknown/promotions → noise

Return format:
[
  {
    "id": "0",
    "category": "jobs",
    "summary": "short summary",
    "whatTheyWant": "action needed",
    "suggestedReplies": ["reply1","reply2"],
    "isUrgent": true
  }
]
`;

    const raw = await callAI(systemPrompt, userPrompt);

    console.log("🧠 AI RAW:", raw);

    // ✅ CLEAN RESPONSE
    let parsed = [];

    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);

      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      console.log("❌ JSON FAILED → FALLBACK");
      parsed = [];
    }

    // ✅ CREATE MAP
    const map = {};
    parsed.forEach((item, index) => {
      if (!item) return;

      const id = item.id?.toString();

      if (!id) return;

      map[id] = {
        id,
        category: item.category || "noise",
        summary: item.summary || "No summary",
        whatTheyWant: item.whatTheyWant || "Check email",
        suggestedReplies: item.suggestedReplies || ["Got it", "Thanks"],
        isUrgent: item.isUrgent ?? item.category === "urgent",
      };
    });

    // ✅ FINAL SAFE MERGE
    return safeEmails.map((email, index) => {
      const ai = map[email.id];

      if (ai) return ai;

      // ✅ SMART FALLBACK
      return {
        id: email.id,
        category: email.subject.toLowerCase().includes("interview")
          ? "jobs"
          : email.subject.toLowerCase().includes("security")
            ? "urgent"
            : "noise",
        summary: email.subject || "No subject",
        whatTheyWant: "Check manually",
        suggestedReplies: ["Got it", "Will check"],
        isUrgent: email.subject.toLowerCase().includes("security"),
      };
    });
  } catch (err) {
    console.error("🔥 BATCH AI FAILED:", err.message);

    return emails.map((e, i) => ({
      id: i.toString(),
      category: "noise",
      summary: e?.subject || "Error",
      whatTheyWant: "No action",
      suggestedReplies: ["OK"],
      isUrgent: false,
    }));
  }
};

module.exports = { batchAnalyzeEmails };
