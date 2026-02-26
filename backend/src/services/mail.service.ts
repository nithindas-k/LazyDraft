import { IMailService } from "../interfaces/services/IMailService";
import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
import { IAIService, IAIParsedMail } from "../interfaces/services/IAIService";
import { IEmailVendor } from "../interfaces/vendors/IEmailVendor";
import { ITemplateRepository, ITemplateEntity } from "../interfaces/repositories/ITemplateRepository";
import { GmailVendor, IGmailAnalytics } from "../vendors/GmailVendor";
import { google } from "googleapis";

export class MailService implements IMailService {
    constructor(
        private readonly mailRepository: IMailRepository,
        private readonly aiService: IAIService,
        private readonly emailVendor: IEmailVendor,
        private readonly templateRepository: ITemplateRepository
    ) { }

    async parseTextToEmail(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail> {
        if (!text || text.trim().length === 0) {
            throw new Error("Text content is required for AI parsing");
        }
        return await this.aiService.parseUnstructuredText(text, fromEmail, tone, language, length);
    }

    async suggestSubjects(body: string): Promise<string[]> {
        return await this.aiService.suggestSubjects(body);
    }

    async sendEmail(mailData: Omit<IMailEntity, "status">, googleAccessToken?: string, refreshToken?: string, trackingBaseUrl?: string): Promise<IMailEntity> {
        console.log("=== MailService.sendEmail START ===");
        if (!mailData.to || !mailData.subject || !mailData.content) {
            throw new Error("Incomplete email data: to, subject, and content are required");
        }
        if (!googleAccessToken && !refreshToken) {
            throw new Error("Google access token or refresh token is required. Please connect your Gmail account first.");
        }

        let savedMail: IMailEntity;
        try {
            savedMail = await this.mailRepository.create({
                ...mailData,
                status: "PENDING",
                createdAt: new Date(),
            });
        } catch (dbErr: any) {
            console.error("MailService: DB save FAILED:", dbErr.message);
            throw dbErr;
        }

        try {
            const resolvedTrackingBaseUrl = (trackingBaseUrl || process.env.PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
            const trackedContent = savedMail.id
                ? `${mailData.content}<img src="${resolvedTrackingBaseUrl}/api/v1/track/open?id=${encodeURIComponent(savedMail.id)}" width="1" height="1" alt="" style="display:none;" referrerpolicy="no-referrer" />`
                : mailData.content;

            const isSent = await this.emailVendor.sendEmail({
                from: mailData.from,
                to: mailData.to,
                cc: mailData.cc,
                bcc: mailData.bcc,
                subject: mailData.subject,
                text: trackedContent,
                accessToken: googleAccessToken,
                refreshToken: refreshToken,
            });

            if (isSent && savedMail.id) {
                const updatedMail = await this.mailRepository.updateStatus(savedMail.id, "SENT");
                return updatedMail as IMailEntity;
            } else {
                throw new Error("Gmail vendor failed to send the email.");
            }
        } catch (error: any) {
            if (savedMail.id) {
                await this.mailRepository.updateStatus(savedMail.id, "FAILED");
            }
            throw error;
        }
    }

    async getUserEmails(userId: string): Promise<IMailEntity[]> {
        return await this.mailRepository.findByUserId(userId);
    }

    async getGmailAnalytics(refreshToken: string): Promise<IGmailAnalytics> {
        return (this.emailVendor as GmailVendor).getGmailAnalytics(refreshToken);
    }

    // ── Templates ──────────────────────────────────────────────────────────────
    async createTemplate(template: ITemplateEntity): Promise<ITemplateEntity> {
        return await this.templateRepository.create(template);
    }

    async getTemplates(userId: string): Promise<ITemplateEntity[]> {
        return await this.templateRepository.findByUserId(userId);
    }

    async deleteTemplate(id: string, userId: string): Promise<boolean> {
        return await this.templateRepository.deleteById(id, userId);
    }

    // ── Read Receipt Tracking ─────────────────────────────────────────────────
    async trackOpen(mailId: string): Promise<void> {
        await this.mailRepository.markOpened(mailId);
    }

    // ── Reply Detection ───────────────────────────────────────────────────────
    async checkReplies(userId: string, refreshToken: string): Promise<void> {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // Get user's sent emails that haven't been marked as replied yet
        const sentEmails = await this.mailRepository.findByUserId(userId);
        const unreplied = sentEmails.filter(m => m.status === "SENT" && !m.repliedAt);

        for (const mail of unreplied.slice(0, 10)) { // check latest 10
            try {
                // Search Gmail for threads matching the subject
                const threadsRes = await gmail.users.threads.list({
                    userId: "me",
                    q: `subject:"${mail.subject}" in:anywhere`,
                    maxResults: 5,
                });
                const threads = threadsRes.data.threads || [];
                for (const thread of threads) {
                    const threadDetail = await gmail.users.threads.get({
                        userId: "me",
                        id: thread.id!,
                        format: "minimal",
                    });
                    const msgCount = threadDetail.data.messages?.length || 0;
                    if (msgCount > 1 && mail.id) {
                        await this.mailRepository.markReplied(mail.id);
                        break;
                    }
                }
            } catch {
                // Skip errors for individual mails
            }
        }
    }
}
