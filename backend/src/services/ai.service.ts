import Groq from "groq-sdk";
import { IAIService, IAIParsedMail, IAutoReplyInput, IAutoReplyIntentResult } from "../interfaces/services/IAIService";

const WORD_COUNT_MAP: Record<string, number> = { short: 100, medium: 200, detailed: 400 };

export class GroqAIService implements IAIService {
    private groq: Groq;
    private model: string;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY || '';
        if (!apiKey) {
            console.warn("GROQ_API_KEY is not set in environment variables.");
        }
        this.groq = new Groq({ apiKey });
        this.model = "llama-3.3-70b-versatile";
    }

    async parseUnstructuredText(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail> {
        try {
            console.log(`Sending text to Groq for parsing: ${text.substring(0, 50)}...`);

            let senderName = "Your Name";
            if (fromEmail) {
                const localPart = fromEmail.split("@")[0] || "";
                senderName = localPart
                    .split(/[._-]/)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(" ");
            }
            const today = new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            const effectiveTone = tone || "Formal";
            const effectiveLanguage = language || "English";
            const wordCount = WORD_COUNT_MAP[length?.toLowerCase() || "medium"] || 200;

            const prompt = `
You are a world-class professional email writer. Today's date is ${today}.
Your task is to parse unstructured text and convert it into a beautifully formatted, polite, professional HTML email.
Write in a ${effectiveTone} tone. Write the email in ${effectiveLanguage}.
Keep the email body to approximately ${wordCount} words.

Return ONLY a valid JSON object with these exact 4 fields: "from", "to", "subject", "body".

───────────────────────────────────────────
STRICT RULES FOR THE "body" HTML:
───────────────────────────────────────────

1. SALUTATION:
   - Start with <p>Dear [Recipient Name if known, otherwise "Sir/Madam"],</p>
   - Leave one blank line after it using a <br/> inside the <p> or as a separate line.

2. PARAGRAPHS — Use exactly 3 body paragraphs wrapped in <p> tags:
   - Each <p> must end with a period.
   - Leave a visible gap between paragraphs (use margin via style or just separate <p> tags — Gmail renders them with spacing).
   - Paragraph 1: State the purpose of the email clearly and professionally in 1-2 sentences.
   - Paragraph 2: Provide full context and details.
     * DATE RULE: If the user mentions a specific date (e.g. "next Tuesday", "March 5th", "in 3 days"), convert it to a real calendar date based on today being ${today}, and wrap it in <strong>. Example: <strong>Tuesday, March 4, 2026</strong>.
     * If the user says "now" or "immediately", use today's date: <strong>${today}</strong>.
     * Always bold: dates, durations, deadlines, names, quantities using <strong></strong>.
   - Paragraph 3: A polite closing action — request approval, ask for a response, or offer further information.

3. CLOSING:
   <p>Thank you for your time and consideration.</p>
   <p>Yours sincerely,<br/>${senderName}</p>

4. SPACING RULES (very important):
   - Each sentence must end with a period and a space before the next sentence.
   - Do NOT run multiple ideas into one long sentence. Split them into clean, readable sentences.
   - Do NOT use ellipses (...) or informal language.
   - Each paragraph should be 2-3 sentences maximum for readability.

5. HTML RULES:
   - Only use: <p>, <strong>, <br/>, <ul>, <li>
   - Do NOT use: <html>, <body>, <head>, <style>, markdown syntax, backticks
   - Return raw HTML string only — no code blocks

Text to parse:
"""
${text}
"""
`;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });

            const responseText = completion.choices[0]?.message?.content || "{}";
            const parsedData = JSON.parse(responseText);

            return {
                from: parsedData.from || "",
                to: parsedData.to || "",
                subject: parsedData.subject || "",
                body: parsedData.body || "",
            };
        } catch (error) {
            console.error("AI Parsing Error:", error);
            throw new Error("Failed to parse text via AI");
        }
    }

    async suggestSubjects(body: string): Promise<string[]> {
        try {
            const prompt = `Generate 3 alternative professional email subject lines for this email body. Return ONLY a valid JSON object with a single key "subjects" containing an array of 3 strings. No explanations.

Email body:
"""
${body.substring(0, 1000)}
"""`;
            const completion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.5,
                response_format: { type: "json_object" }
            });
            const responseText = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(responseText);
            return Array.isArray(parsed.subjects) ? parsed.subjects.slice(0, 3) : [];
        } catch (error) {
            console.error("Subject Suggestion Error:", error);
            return [];
        }
    }

    async generateAutoReply(input: IAutoReplyInput): Promise<string> {
        try {
            const tone = input.tone || "professional";
            const policy = input.policy || "Keep it concise and ask one clarifying question if needed.";
            const recipientName = input.recipientName?.trim();

            const prompt = `You are an assistant that drafts safe business email replies.
Return only valid HTML using <p>, <strong>, <br/> tags.
Rules:
1) Keep reply short and professional.
2) Do not provide legal, medical, or financial commitments.
3) If the incoming message is unclear, ask for one clarification.
4) Do not promise actions that were not explicitly requested.
5) End with a polite close.

Tone: ${tone}
Policy: ${policy}
Sender: ${input.sender}
Incoming Subject: ${input.subject}
Incoming Body:
${input.body}

Return only HTML for the reply body.`;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.3,
            });

            const content = completion.choices[0]?.message?.content?.trim() || "";
            if (!content) {
                return `<p>${recipientName ? `Hi ${recipientName},` : "Hello,"}</p><p>Thank you for your email. Could you please share a bit more detail so I can help you accurately?</p><p>Best regards,</p>`;
            }
            return content;
        } catch (error) {
            console.error("Auto reply generation failed:", error);
            return "<p>Hello,</p><p>Thank you for your email. I will review your message and get back to you shortly.</p><p>Best regards,</p>";
        }
    }

    async classifyAutoReplyIntent(subject: string, body: string, sender?: string): Promise<IAutoReplyIntentResult> {
        const fallback = this.heuristicIntent(subject, body, sender);
        try {
            const prompt = `Classify this inbound email into exactly one intent:
- Complaint
- Inquiry
- Follow-up
- Spam-like

Return ONLY valid JSON:
{
  "intent": "Complaint|Inquiry|Follow-up|Spam-like",
  "confidence": 0.0 to 1.0,
  "reason": "short reason"
}

Sender: ${sender || ""}
Subject: ${subject || ""}
Body:
${(body || "").slice(0, 4000)}
`;

            const completion = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.model,
                temperature: 0.1,
                response_format: { type: "json_object" },
            });

            const raw = completion.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(raw || "{}");
            const intent = this.normalizeIntent(parsed?.intent);
            if (!intent) return fallback;

            const confidence = Number(parsed?.confidence);
            return {
                intent,
                confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : fallback.confidence,
                reason: typeof parsed?.reason === "string" ? parsed.reason.slice(0, 160) : fallback.reason,
            };
        } catch (error) {
            console.error("Intent classification failed:", error);
            return fallback;
        }
    }

    private normalizeIntent(v?: string): IAutoReplyIntentResult["intent"] | null {
        const value = (v || "").trim().toLowerCase();
        if (value === "complaint") return "Complaint";
        if (value === "inquiry") return "Inquiry";
        if (value === "follow-up" || value === "follow up" || value === "followup") return "Follow-up";
        if (value === "spam-like" || value === "spam like" || value === "spam") return "Spam-like";
        return null;
    }

    private heuristicIntent(subject: string, body: string, sender?: string): IAutoReplyIntentResult {
        const text = `${subject || ""} ${body || ""}`.toLowerCase();
        const senderLower = (sender || "").toLowerCase();

        const spamSignals = ["unsubscribe", "click here", "limited offer", "win now", "lottery", "crypto giveaway", "free money", "noreply"];
        if (spamSignals.some((w) => text.includes(w)) || senderLower.includes("no-reply") || senderLower.includes("noreply")) {
            return { intent: "Spam-like", confidence: 0.7, reason: "Promotional/spam-like language detected" };
        }

        const complaintSignals = ["not working", "issue", "problem", "refund", "angry", "bad", "delay", "frustrated", "complaint"];
        if (complaintSignals.some((w) => text.includes(w))) {
            return { intent: "Complaint", confidence: 0.65, reason: "Issue/complaint wording detected" };
        }

        const followUpSignals = ["following up", "follow up", "any update", "reminder", "checking in", "still waiting"];
        if (followUpSignals.some((w) => text.includes(w))) {
            return { intent: "Follow-up", confidence: 0.65, reason: "Follow-up phrasing detected" };
        }

        return { intent: "Inquiry", confidence: 0.6, reason: "Default informational inquiry" };
    }
}
