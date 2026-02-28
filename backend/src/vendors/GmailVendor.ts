import { google } from "googleapis";
import { IEmailVendor, IEmailPayload } from "../interfaces/vendors/IEmailVendor";

export interface IGmailAnalytics {
    totalInbox: number;
    unread: number;
    topSenders: { email: string; count: number }[];
    dailyVolume: { date: string; received: number }[];
    labels: { name: string; count: number }[];
}

export interface IGmailInboundMessage {
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    date?: string;
    inReplyTo?: string;
    autoSubmitted?: string;
    precedence?: string;
    listId?: string;
}

export class GmailVendor implements IEmailVendor {
    private oauth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
    }

    async sendEmail(payload: IEmailPayload): Promise<boolean> {
        try {
            if (!payload.accessToken && !payload.refreshToken) {
                console.error("Gmail Vendor: No accessToken or refreshToken provided. Cannot send email.");
                return false;
            }

            console.log(`Gmail Vendor: Sending email to ${payload.to} from ${payload.from}`);

            if (payload.refreshToken) {
                this.oauth2Client.setCredentials({ refresh_token: payload.refreshToken });
            } else if (payload.accessToken) {
                this.oauth2Client.setCredentials({ access_token: payload.accessToken });
            }
            const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

            const utf8Subject = `=?utf-8?B?${Buffer.from(payload.subject).toString("base64")}?=`;
            const messageParts = [
                `From: ${payload.from}`,
                `To: ${payload.to}`,
                ...(payload.cc ? [`Cc: ${payload.cc}`] : []),
                ...(payload.bcc ? [`Bcc: ${payload.bcc}`] : []),
                `Subject: ${utf8Subject}`,
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=utf-8",
                "Content-Transfer-Encoding: quoted-printable",
                "",
                payload.text || "",
            ];
            const message = messageParts.join("\r\n");

            const encodedMessage = Buffer.from(message)
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            const result = await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: encodedMessage,
                },
            });

            console.log("Gmail Vendor: Email sent successfully. Message ID:", result.data.id);
            return true;
        } catch (error: any) {
            const errMsg = error?.message || "Unknown error";
            const errDetails = error?.response?.data ? JSON.stringify(error.response.data, null, 2) : "No response details";

            console.error("Gmail Vendor Exception:", errMsg);
            console.error("Gmail API Error Details:", errDetails);

            // Write to file so we can always read it
            const fs = require("fs");
            fs.writeFileSync("gmail_error.log", `Error: ${errMsg}\nDetails: ${errDetails}\nStack: ${error?.stack || ""}`);

            return false;
        }
    }

    async getGmailAnalytics(refreshToken: string): Promise<IGmailAnalytics> {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

        // 1. Fetch up to 100 recent message IDs
        const listRes = await gmail.users.messages.list({
            userId: "me",
            maxResults: 100,
            labelIds: ["INBOX"],
        });
        const messages = listRes.data.messages || [];
        const totalInbox = listRes.data.resultSizeEstimate || messages.length;

        // 2. Fetch unread count
        const unreadRes = await gmail.users.messages.list({
            userId: "me",
            maxResults: 1,
            labelIds: ["INBOX", "UNREAD"],
            q: "is:unread",
        });
        const unread = unreadRes.data.resultSizeEstimate || 0;

        // 3. Batch fetch metadata (minimal format — no bodies)
        const metaList = await Promise.all(
            messages.slice(0, 50).map((m) =>
                gmail.users.messages.get({
                    userId: "me",
                    id: m.id!,
                    format: "metadata",
                    metadataHeaders: ["From", "Date"],
                })
            )
        );

        // 4. Aggregate top senders
        const senderMap: Record<string, number> = {};
        const dateMap: Record<string, number> = {};

        for (const msg of metaList) {
            const headers = msg.data.payload?.headers || [];
            const fromHeader = headers.find((h) => h.name === "From")?.value || "";
            const dateHeader = headers.find((h) => h.name === "Date")?.value || "";

            // Extract email address from "Name <email>" format
            const emailMatch = fromHeader.match(/<(.+?)>/) || fromHeader.match(/(\S+@\S+)/);
            const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : fromHeader.toLowerCase();
            if (senderEmail) senderMap[senderEmail] = (senderMap[senderEmail] || 0) + 1;

            // Group by date (last 14 days)
            if (dateHeader) {
                try {
                    const d = new Date(dateHeader);
                    const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
                    dateMap[key] = (dateMap[key] || 0) + 1;
                } catch { /* skip malformed */ }
            }
        }

        const topSenders = Object.entries(senderMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([email, count]) => ({ email, count }));

        // Build last 14 days volume (fill missing days with 0)
        const dailyVolume: { date: string; received: number }[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            dailyVolume.push({ date: key, received: dateMap[key] || 0 });
        }

        // 5. Fetch label list
        const labelsRes = await gmail.users.labels.list({ userId: "me" });
        const systemLabels = ["INBOX", "SENT", "DRAFT", "SPAM", "TRASH", "UNREAD", "STARRED"];
        const userLabels = (labelsRes.data.labels || [])
            .filter((l) => !systemLabels.includes(l.id || "") && l.type === "user")
            .slice(0, 6)
            .map((l) => ({ name: l.name || "Label", count: l.messagesTotal || 0 }));

        return { totalInbox, unread, topSenders, dailyVolume, labels: userLabels };
    }

    private createGmailClient(refreshToken: string) {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        return google.gmail({ version: "v1", auth: this.oauth2Client });
    }

    private decodeBase64Url(value?: string): string {
        if (!value) return "";
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        return Buffer.from(normalized, "base64").toString("utf-8");
    }

    private extractBody(payload?: any): string {
        if (!payload) return "";
        if (payload.body?.data) {
            return this.decodeBase64Url(payload.body.data);
        }
        if (!Array.isArray(payload.parts)) return "";

        const htmlPart = payload.parts.find((p: any) => p?.mimeType === "text/html" && p?.body?.data);
        if (htmlPart?.body?.data) return this.decodeBase64Url(htmlPart.body.data);

        const textPart = payload.parts.find((p: any) => p?.mimeType === "text/plain" && p?.body?.data);
        if (textPart?.body?.data) return this.decodeBase64Url(textPart.body.data).replace(/\n/g, "<br/>");

        for (const part of payload.parts) {
            const nested = this.extractBody(part);
            if (nested) return nested;
        }
        return "";
    }

    private findHeader(headers: Array<{ name?: string | null; value?: string | null }> | undefined, key: string): string {
        if (!headers) return "";
        return headers.find((h) => (h.name || "").toLowerCase() === key.toLowerCase())?.value || "";
    }

    async listRecentInboxMessages(refreshToken: string, after?: Date, maxResults = 20): Promise<IGmailInboundMessage[]> {
        const gmail = this.createGmailClient(refreshToken);
        const queryParts = ["in:inbox", "-from:me", "-category:promotions"];
        if (after) {
            const epochSeconds = Math.floor(after.getTime() / 1000);
            queryParts.push(`after:${epochSeconds}`);
        }
        const q = queryParts.join(" ");

        const listRes = await gmail.users.messages.list({
            userId: "me",
            q,
            maxResults,
        });

        const ids = listRes.data.messages || [];
        if (ids.length === 0) return [];

        const details = await Promise.all(
            ids.map((m) =>
                gmail.users.messages.get({
                    userId: "me",
                    id: m.id!,
                    format: "full",
                })
            )
        );

        return details
            .map((item) => {
                const data = item.data;
                const headers = data.payload?.headers;
                const from = this.findHeader(headers, "From");
                const to = this.findHeader(headers, "To");
                const subject = this.findHeader(headers, "Subject");
                const inReplyTo = this.findHeader(headers, "In-Reply-To");
                const date = this.findHeader(headers, "Date");
                const autoSubmitted = this.findHeader(headers, "Auto-Submitted");
                const precedence = this.findHeader(headers, "Precedence");
                const listId = this.findHeader(headers, "List-Id");
                const body = this.extractBody(data.payload);

                if (!data.id || !data.threadId) return null;

                return {
                    id: data.id,
                    threadId: data.threadId,
                    from,
                    to,
                    subject,
                    body,
                    date,
                    inReplyTo,
                    autoSubmitted,
                    precedence,
                    listId,
                } as IGmailInboundMessage;
            })
            .filter((m): m is IGmailInboundMessage => !!m);
    }

    async getMessageById(refreshToken: string, messageId: string): Promise<IGmailInboundMessage | null> {
        const gmail = this.createGmailClient(refreshToken);
        const result = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
        });
        const data = result.data;
        if (!data.id || !data.threadId) return null;
        const headers = data.payload?.headers;
        return {
            id: data.id,
            threadId: data.threadId,
            from: this.findHeader(headers, "From"),
            to: this.findHeader(headers, "To"),
            subject: this.findHeader(headers, "Subject"),
            body: this.extractBody(data.payload),
            date: this.findHeader(headers, "Date"),
            inReplyTo: this.findHeader(headers, "In-Reply-To"),
            autoSubmitted: this.findHeader(headers, "Auto-Submitted"),
            precedence: this.findHeader(headers, "Precedence"),
            listId: this.findHeader(headers, "List-Id"),
        };
    }

    async sendReplyInThread(params: {
        refreshToken: string;
        from: string;
        to: string;
        subject: string;
        html: string;
        threadId: string;
        inReplyTo?: string;
    }): Promise<boolean> {
        try {
            const gmail = this.createGmailClient(params.refreshToken);
            const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject).toString("base64")}?=`;
            const messageParts = [
                `From: ${params.from}`,
                `To: ${params.to}`,
                `Subject: ${utf8Subject}`,
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=utf-8",
                "Content-Transfer-Encoding: quoted-printable",
                "Auto-Submitted: auto-replied",
                ...(params.inReplyTo ? [`In-Reply-To: ${params.inReplyTo}`, `References: ${params.inReplyTo}`] : []),
                "",
                params.html,
            ];
            const raw = Buffer.from(messageParts.join("\r\n"))
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw,
                    threadId: params.threadId,
                },
            });
            return true;
        } catch (error) {
            console.error("Failed to send threaded reply:", error);
            return false;
        }
    }
}
