import Groq from "groq-sdk";
import { IAIService, IAIParsedMail } from "../interfaces/services/IAIService";

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
}
