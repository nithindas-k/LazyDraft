import { google } from "googleapis";
import { IEmailVendor, IEmailPayload } from "../interfaces/vendors/IEmailVendor";

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
            if (!payload.accessToken) {
                console.error("Gmail Vendor: No accessToken provided. Cannot send email.");
                return false;
            }

            console.log(`Gmail Vendor: Sending email to ${payload.to} from ${payload.from}`);
            this.oauth2Client.setCredentials({ access_token: payload.accessToken });
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
}
