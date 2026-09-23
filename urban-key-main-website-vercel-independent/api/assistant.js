const MAX_MESSAGES = 8;
const MAX_INPUT = 1000;

const guardrail = `You are UrbanKey's independent Singapore property workflow concierge. Give concise, practical, non-binding information only. Never provide legal, tax, financial, eligibility, licensing, regulatory, valuation, ownership, or safety advice. Never claim live availability, send messages, book appointments, file paperwork, accept terms, make an offer, transfer money, submit to a government agency, or impersonate an agent, lawyer, owner, bank, or authority. Explain that the user must verify all details with an appointed professional and explicitly authorise any external action. Listings may be illustrative demonstrations.`;

function fallbackAnswer(mode) {
  return `${mode === "agent" ? "Agent / co-broker" : "Buyer / tenant"} workflow note: organise the brief, shortlist, and review checklist first. Keep any external contact, appointment, document sharing, offer, professional hand-off, or government step as an explicit approval-required action. Verify property and market information independently with the appropriate appointed professional.`;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const { mode, messages } = request.body ?? {};
  if (mode !== "buyer" && mode !== "agent") return response.status(400).json({ error: "Choose a supported assistant mode." });
  if (!Array.isArray(messages) || !messages.length) return response.status(400).json({ error: "Provide a message to the assistant." });
  const safeMessages = messages.slice(-MAX_MESSAGES).map(item => ({
    role: item?.role === "assistant" ? "assistant" : "user",
    content: String(item?.content ?? "").trim().slice(0, MAX_INPUT),
  })).filter(item => item.content);
  if (!safeMessages.length) return response.status(400).json({ error: "Provide a non-empty message to the assistant." });

  // A missing provider key is intentionally explicit rather than silently pretending that a live model answered.
  if (!process.env.OPENAI_API_KEY) return response.status(200).json({ answer: fallbackAnswer(mode), configured: false });

  try {
    const providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, max_tokens: 450, messages: [{ role: "system", content: guardrail }, ...safeMessages] }),
    });
    if (!providerResponse.ok) throw new Error(`Provider response ${providerResponse.status}`);
    const result = await providerResponse.json();
    const answer = String(result?.choices?.[0]?.message?.content ?? "").trim();
    return response.status(200).json({ answer: answer || fallbackAnswer(mode), configured: true });
  } catch {
    return response.status(200).json({ answer: `${fallbackAnswer(mode)} The secure AI provider is temporarily unavailable, so no external communication or action was attempted.`, configured: true });
  }
}
