// Quick test to verify Gmail API access
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const TEST_TOKEN = process.argv[2];

if (!TEST_TOKEN) {
    console.log("Usage: npx ts-node src/test-gmail.ts <YOUR_ACCESS_TOKEN>");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({ access_token: TEST_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

async function test() {
    try {
        // First test: check if we can access Gmail at all
        const profile = await gmail.users.getProfile({ userId: "me" });
        console.log("✅ Gmail API connected! Email:", profile.data.emailAddress);

        // Second test: send a test email to yourself
        const message = [
            `From: ${profile.data.emailAddress}`,
            `To: ${profile.data.emailAddress}`,
            `Subject: LazyDraft Test`,
            "MIME-Version: 1.0",
            "Content-Type: text/plain; charset=utf-8",
            "",
            "This is a test email from LazyDraft!",
        ].join("\r\n");

        const encoded = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const result = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encoded },
        });

        console.log("✅ Email sent! Message ID:", result.data.id);
    } catch (error: any) {
        console.error("❌ Gmail API Error:", error.message);
        if (error.response?.data) {
            console.error("Details:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

test();
