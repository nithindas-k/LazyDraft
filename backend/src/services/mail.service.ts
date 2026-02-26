import { IMailService } from "../interfaces/services/IMailService";
import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
import { IAIService, IAIParsedMail } from "../interfaces/services/IAIService";
import { IEmailVendor } from "../interfaces/vendors/IEmailVendor";

export class MailService implements IMailService {
    constructor(
        private readonly mailRepository: IMailRepository,
        private readonly aiService: IAIService,
        private readonly emailVendor: IEmailVendor
    ) { }

    async parseTextToEmail(text: string, fromEmail?: string): Promise<IAIParsedMail> {
        if (!text || text.trim().length === 0) {
            throw new Error("Text content is required for AI parsing");
        }
        return await this.aiService.parseUnstructuredText(text, fromEmail);
    }

    async sendEmail(mailData: Omit<IMailEntity, "status">, googleAccessToken?: string, refreshToken?: string): Promise<IMailEntity> {
        console.log("=== MailService.sendEmail START ===");
        console.log("  userId:", mailData.userId);
        console.log("  to:", mailData.to);
        console.log("  hasGoogleAccessToken:", !!googleAccessToken);
        console.log("  hasRefreshToken:", !!refreshToken);
        console.log("  refreshToken value:", refreshToken ? refreshToken.slice(0, 20) + "..." : "EMPTY/UNDEFINED");

        if (!mailData.to || !mailData.subject || !mailData.content) {
            throw new Error("Incomplete email data: to, subject, and content are required");
        }

        if (!googleAccessToken && !refreshToken) {
            console.error("MailService: NO TOKEN AVAILABLE — throwing before DB save");
            throw new Error("Google access token or refresh token is required. Please connect your Gmail account first.");
        }

        // Persist to DB as PENDING
        console.log("MailService: Saving PENDING record to DB...");
        let savedMail: IMailEntity;
        try {
            savedMail = await this.mailRepository.create({
                ...mailData,
                status: "PENDING",
                createdAt: new Date(),
            });
            console.log("MailService: DB save SUCCESS — savedMail.id:", savedMail.id);
        } catch (dbErr: any) {
            console.error("MailService: DB save FAILED:", dbErr.message);
            throw dbErr;
        }

        try {
            console.log(`MailService: Delegating to GmailVendor for ${mailData.to}`);
            const isSent = await this.emailVendor.sendEmail({
                from: mailData.from,
                to: mailData.to,
                subject: mailData.subject,
                text: mailData.content,
                accessToken: googleAccessToken,
                refreshToken: refreshToken,
            });

            console.log("MailService: GmailVendor returned isSent:", isSent);

            if (isSent && savedMail.id) {
                const updatedMail = await this.mailRepository.updateStatus(savedMail.id, "SENT");
                console.log("MailService: Status updated to SENT");
                return updatedMail as IMailEntity;
            } else {
                throw new Error("Gmail vendor failed to send the email. Check backend logs for details.");
            }
        } catch (error: any) {
            console.error("MailService sendEmail error:", error.message);
            if (savedMail.id) {
                await this.mailRepository.updateStatus(savedMail.id, "FAILED");
                console.log("MailService: Status updated to FAILED");
            }
            throw error;
        }
    }

    async getUserEmails(userId: string): Promise<IMailEntity[]> {
        console.log("MailService.getUserEmails userId:", userId);
        const results = await this.mailRepository.findByUserId(userId);
        console.log("MailService.getUserEmails found:", results.length, "records");
        return results;
    }
}

