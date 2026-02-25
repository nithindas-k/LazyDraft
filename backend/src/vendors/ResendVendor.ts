import { Resend } from "resend";
import { IEmailVendor, IEmailPayload } from "../interfaces/vendors/IEmailVendor";

export class ResendVendor implements IEmailVendor {
    private resend: Resend;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY || "";
        if (!apiKey) {
            console.warn("RESEND_API_KEY is not set.");
        }
        this.resend = new Resend(apiKey);
    }

    async sendEmail(payload: IEmailPayload): Promise<boolean> {
        try {
            console.log(`Sending email via Resend to: ${payload.to}`);
            const { data, error } = await this.resend.emails.send({
                from: payload.from || "onboarding@resend.dev",
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
            });

            if (error) {
                console.error("Resend API Error:", JSON.stringify(error, null, 2));
                return false;
            }

            return true;
        } catch (error) {
            console.error("Resend Vendor Exception:", error);
            return false;
        }
    }
}
