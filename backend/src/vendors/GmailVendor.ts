import { google } from "googleapis";
import { IEmailVendor, IEmailPayload } from "../interfaces/vendors/IEmailVendor";

export interface IGmailAnalytics {
    totalInbox: number;
    unread: number;
    topSenders: { email: string; count: number }[];
    dailyVolume: { date: string; received: number }[];
    labels: { name: string; count: number }[];
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
}
