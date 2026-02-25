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

    async sendEmail(mailData: Omit<IMailEntity, "status">, googleAccessToken?: string): Promise<IMailEntity> {
        if (!mailData.to || !mailData.subject || !mailData.content) {
            throw new Error("Incomplete email data: to, subject, and content are required");
        }

        if (!googleAccessToken) {
            throw new Error("Google access token is required. Please connect your Gmail account first.");
        }

        // Persist to DB as PENDING
        const savedMail = await this.mailRepository.create({
            ...mailData,
            status: "PENDING",
            createdAt: new Date(),
        });

        try {
            console.log(`MailService: Delegating to GmailVendor for ${mailData.to}`);
            const isSent = await this.emailVendor.sendEmail({
                from: mailData.from,
                to: mailData.to,
                subject: mailData.subject,
                text: mailData.content,
                accessToken: googleAccessToken,
            });

            if (isSent && savedMail.id) {
                const updatedMail = await this.mailRepository.updateStatus(savedMail.id, "SENT");
                return updatedMail as IMailEntity;
            } else {
                throw new Error("Gmail vendor failed to send the email. Check backend logs for details.");
            }
        } catch (error: any) {
            console.error("MailService sendEmail error:", error.message);
            if (savedMail.id) {
                await this.mailRepository.updateStatus(savedMail.id, "FAILED");
            }
            throw error;
        }
    }

    async getUserEmails(userId: string): Promise<IMailEntity[]> {
        return await this.mailRepository.findByUserId(userId);
    }
}
