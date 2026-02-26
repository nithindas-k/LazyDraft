import { IMailService } from "../interfaces/services/IMailService";
import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
import { IAIService, IAIParsedMail } from "../interfaces/services/IAIService";
import { IEmailVendor } from "../interfaces/vendors/IEmailVendor";
import { ITemplateRepository, ITemplateEntity } from "../interfaces/repositories/ITemplateRepository";
import { IRecurringMailEntity, IRecurringMailRepository } from "../interfaces/repositories/IRecurringMailRepository";
import { GmailVendor, IGmailAnalytics } from "../vendors/GmailVendor";
import { google } from "googleapis";
import { User } from "../models/User";

export class MailService implements IMailService {
    private isProcessingScheduled = false;
    private isProcessingRecurring = false;
    constructor(
        private readonly mailRepository: IMailRepository,
        private readonly aiService: IAIService,
        private readonly emailVendor: IEmailVendor,
        private readonly templateRepository: ITemplateRepository,
        private readonly recurringMailRepository: IRecurringMailRepository
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
        // If scheduledAt is provided (already validated in controller), always queue it.
        const shouldSchedule = !!mailData.scheduledAt;
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

        if (shouldSchedule) {
            return savedMail;
        }

        return this.sendPersistedMail(savedMail, googleAccessToken, refreshToken, trackingBaseUrl);
    }

    private async sendPersistedMail(
        savedMail: IMailEntity,
        googleAccessToken?: string,
        refreshToken?: string,
        trackingBaseUrl?: string
    ): Promise<IMailEntity> {
        const resolvedTrackingBaseUrl = (trackingBaseUrl || process.env.PUBLIC_API_URL || process.env.API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
        const trackedContent = savedMail.id
            ? `${savedMail.content}<img src="${resolvedTrackingBaseUrl}/api/v1/track/open?id=${encodeURIComponent(savedMail.id)}" width="1" height="1" alt="" style="display:none;" referrerpolicy="no-referrer" />`
            : savedMail.content;

        try {
            const isSent = await this.emailVendor.sendEmail({
                from: savedMail.from,
                to: savedMail.to,
                cc: savedMail.cc,
                bcc: savedMail.bcc,
                subject: savedMail.subject,
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

    async processScheduledEmails(trackingBaseUrl?: string): Promise<void> {
        if (this.isProcessingScheduled) return;
        this.isProcessingScheduled = true;
        try {
            const dueMails = await this.mailRepository.findDueScheduled(new Date(), 25);
            for (const mail of dueMails) {
                if (!mail.id) continue;
                try {
                    const user = await User.findById(mail.userId).select("refreshToken").lean();
                    const refreshToken = user?.refreshToken;
                    if (!refreshToken) {
                        await this.mailRepository.updateStatus(mail.id, "FAILED");
                        continue;
                    }
                    await this.sendPersistedMail(mail, undefined, refreshToken, trackingBaseUrl);
                } catch {
                    await this.mailRepository.updateStatus(mail.id, "FAILED");
                }
            }
        } finally {
            this.isProcessingScheduled = false;
        }
    }

    // Recurring mail
    async createRecurringMail(data: IRecurringMailEntity): Promise<IRecurringMailEntity> {
        const nextRunAt = this.computeNextRun(new Date(), data.daysOfWeek, data.timeOfDay, data.timezone);
        return this.recurringMailRepository.create({
            ...data,
            isActive: data.isActive ?? true,
            nextRunAt,
        });
    }

    async getRecurringMails(userId: string): Promise<IRecurringMailEntity[]> {
        return this.recurringMailRepository.findByUserId(userId);
    }

    async updateRecurringMail(id: string, userId: string, data: Partial<IRecurringMailEntity>): Promise<IRecurringMailEntity | null> {
        const existing = await this.recurringMailRepository.findByIdAndUser(id, userId);
        if (!existing) return null;
        const merged = { ...existing, ...data } as IRecurringMailEntity;
        const nextRunAt = this.computeNextRun(new Date(), merged.daysOfWeek, merged.timeOfDay, merged.timezone);
        return this.recurringMailRepository.updateByIdAndUser(id, userId, { ...data, nextRunAt });
    }

    async deleteRecurringMail(id: string, userId: string): Promise<boolean> {
        return this.recurringMailRepository.deleteByIdAndUser(id, userId);
    }

    async toggleRecurringMail(id: string, userId: string): Promise<IRecurringMailEntity | null> {
        const existing = await this.recurringMailRepository.findByIdAndUser(id, userId);
        if (!existing) return null;
        const isActive = !existing.isActive;
        const nextRunAt = isActive
            ? this.computeNextRun(new Date(), existing.daysOfWeek, existing.timeOfDay, existing.timezone)
            : existing.nextRunAt;
        return this.recurringMailRepository.updateByIdAndUser(id, userId, { isActive, nextRunAt });
    }

    async runRecurringNow(id: string, userId: string): Promise<void> {
        const recurring = await this.recurringMailRepository.findByIdAndUser(id, userId);
        if (!recurring) throw new Error("Recurring mail not found");
        await this.executeRecurring(recurring);
        const nextRunAt = this.computeNextRun(new Date(), recurring.daysOfWeek, recurring.timeOfDay, recurring.timezone);
        await this.recurringMailRepository.updateByIdAndUser(recurring.id!, userId, { lastSentAt: new Date(), nextRunAt });
    }

    async processRecurringMails(): Promise<void> {
        if (this.isProcessingRecurring) return;
        this.isProcessingRecurring = true;
        try {
            const dueItems = await this.recurringMailRepository.findDueActive(new Date(), 25);
            for (const item of dueItems) {
                if (!item.id) continue;
                try {
                    await this.executeRecurring(item);
                    const nextRunAt = this.computeNextRun(new Date(), item.daysOfWeek, item.timeOfDay, item.timezone);
                    await this.recurringMailRepository.updateByIdAndUser(item.id, item.userId, {
                        lastSentAt: new Date(),
                        nextRunAt,
                    });
                } catch (error) {
                    console.error("Recurring send failed:", error);
                }
            }
        } finally {
            this.isProcessingRecurring = false;
        }
    }

    private async executeRecurring(item: IRecurringMailEntity): Promise<void> {
        const user = await User.findById(item.userId).select("refreshToken").lean();
        const refreshToken = user?.refreshToken;
        if (!refreshToken) throw new Error("User refresh token missing");

        for (const recipient of item.to) {
            const saved = await this.mailRepository.create({
                userId: item.userId,
                from: item.from,
                to: recipient,
                cc: item.cc?.join(","),
                bcc: item.bcc?.join(","),
                subject: item.subject,
                content: item.content,
                status: "PENDING",
                createdAt: new Date(),
            });
            try {
                await this.sendPersistedMail(saved, undefined, refreshToken, process.env.PUBLIC_API_URL || process.env.API_BASE_URL);
            } catch {
                // sendPersistedMail already marks FAILED
            }
        }
    }

    private computeNextRun(from: Date, daysOfWeek: number[], timeOfDay: string, timezone: string): Date {
        const [hh, mm] = timeOfDay.split(":").map(Number);
        const start = new Date(from.getTime() + 60 * 1000); // at least +1 minute
        for (let i = 0; i < 60 * 24 * 8; i++) {
            const candidate = new Date(start.getTime() + i * 60 * 1000);
            const parts = new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).formatToParts(candidate);
            const weekdayStr = parts.find(p => p.type === "weekday")?.value || "";
            const hourStr = parts.find(p => p.type === "hour")?.value || "";
            const minuteStr = parts.find(p => p.type === "minute")?.value || "";
            const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            const weekday = weekdayMap[weekdayStr];
            if (daysOfWeek.includes(weekday) && Number(hourStr) === hh && Number(minuteStr) === mm) {
                return candidate;
            }
        }
        const fallback = new Date(from);
        fallback.setMinutes(fallback.getMinutes() + 5);
        return fallback;
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
