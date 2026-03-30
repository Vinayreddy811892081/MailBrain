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
        temperature: 0,
        max_tokens: 500, // ✅ lower to reduce truncation / rambling
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

// ✅ Try to recover partial JSON arrays
const tryParseJSONArray = (raw) => {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(clean.slice(start, end + 1));
      }
    } catch {}

    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      if (start !== -1) {
        const partial = clean.slice(start);

        // split objects roughly and parse valid ones
        const matches = partial.match(/\{[\s\S]*?\}(?=\s*,|\s*\])/g) || [];
        const items = [];
        for (const m of matches) {
          try {
            items.push(JSON.parse(m));
          } catch {}
        }
        return items;
      }
    } catch {}

    return [];
  }
};

// ✅ Small heuristic fallback
const classifyFallback = (email) => {
  const subject = (email.subject || "").toLowerCase();
  const body = (email.body || "").toLowerCase();
  const text = `${subject} ${body}`;

  const has = (words) => words.some((w) => text.includes(w));

  if (
    has([
      "interview",
      "job",
      "application",
      "recruiter",
      "hiring",
      "resume",
      "candidate",
      "designer role",
      "product designer",
    ])
  ) {
    return {
      category: "jobs",
      isUrgent: false,
      whatTheyWant: "Respond about a job or interview",
    };
  }

  if (
    has([
      "otp",
      "payment due",
      "invoice overdue",
      "security alert",
      "password",
      "sign in",
      "login attempt",
      "verification code",
      "account recovery",
      "2-step verification",
    ])
  ) {
    return {
      category: "urgent",
      isUrgent: true,
      whatTheyWant: "Check account or payment issue",
    };
  }

  if (
    has([
      "google",
      "chatgpt",
      "system alert",
      "notification",
      "account update",
      "policy update",
      "shared with you",
    ])
  ) {
    return {
      category: "company",
      isUrgent: false,
      whatTheyWant: "Review the notification",
    };
  }

  return {
    category: "noise",
    isUrgent: false,
    whatTheyWant: "No action",
  };
};

// ✅ FINAL MAIN FUNCTION
const batchAnalyzeEmails = async (emails = []) => {
  try {
    if (!emails.length) return [];

    // ✅ Keep batch small and prompt compact
    const limitedEmails = emails.slice(0, 5);

    const safeEmails = limitedEmails.map((e, i) => ({
      id: i.toString(),
      from: (e.fromName || e.from || "").slice(0, 60),
      subject: (e.subject || "").slice(0, 120),
      body: (e.bodyText || "").replace(/\s+/g, " ").slice(0, 80),
    }));

    // ✅ Compact JSON prompt
    const userPrompt = JSON.stringify(safeEmails);

    const systemPrompt = `
You are an email classifier.

Return ONLY a valid JSON array.
No markdown.
No explanation.
Do not omit any id.
Do not change any id.

Allowed categories only:
urgent, jobs, bills, company, unreplied, noise

For each input item return:
id, category, summary, whatTheyWant, suggestedReplies, isUrgent

Rules:
- summary must be under 8 words
- whatTheyWant must be under 6 words
- suggestedReplies must contain exactly 2 short replies
- replies must be under 4 words each

Example:
[{"id":"0","category":"jobs","summary":"Interview invitation","whatTheyWant":"Confirm availability","suggestedReplies":["I’m interested","Need details"],"isUrgent":false}]
`.trim();

    const raw = await callAI(systemPrompt, userPrompt);
    console.log("🧠 AI RAW:", raw);

    let parsed = tryParseJSONArray(raw);
    if (!Array.isArray(parsed)) parsed = [];

    if (parsed.length === 0) {
      console.log("❌ JSON FAILED → FALLBACK");
    }

    const map = {};
    parsed.forEach((item) => {
      const id = item?.id?.toString?.();
      if (!id) return;

      map[id] = {
        id,
        category: [
          "urgent",
          "jobs",
          "bills",
          "company",
          "unreplied",
          "noise",
        ].includes(item.category)
          ? item.category
          : "noise",
        summary: (item.summary || "No summary").toString().slice(0, 80),
        whatTheyWant: (item.whatTheyWant || "Check email")
          .toString()
          .slice(0, 60),
        suggestedReplies:
          Array.isArray(item.suggestedReplies) && item.suggestedReplies.length
            ? item.suggestedReplies
                .slice(0, 2)
                .map((r) => String(r).slice(0, 40))
            : ["Got it", "Thanks"],
        isUrgent:
          typeof item.isUrgent === "boolean"
            ? item.isUrgent
            : item.category === "urgent",
      };
    });

    return safeEmails.map((email) => {
      const ai = map[email.id];
      if (ai) return ai;

      const fallback = classifyFallback(email);
      return {
        id: email.id,
        category: fallback.category,
        summary: email.subject || "No subject",
        whatTheyWant: fallback.whatTheyWant,
        suggestedReplies:
          fallback.category === "jobs"
            ? ["I’m interested", "Need details"]
            : fallback.category === "urgent"
              ? ["I’ll check", "Thanks"]
              : ["Got it", "Thanks"],
        isUrgent: fallback.isUrgent,
      };
    });
  } catch (err) {
    console.error("🔥 BATCH AI FAILED:", err.message);

    return emails.slice(0, 5).map((e, i) => ({
      id: i.toString(),
      category: "noise",
      summary: e?.subject || "Error",
      whatTheyWant: "No action",
      suggestedReplies: ["OK", "Thanks"],
      isUrgent: false,
    }));
  }
};

module.exports = { batchAnalyzeEmails };
