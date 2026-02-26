import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/statusCodes";
import { MESSAGES } from "../constants/messages";
import { IMailService } from "../interfaces/services/IMailService";

export class MailController {
    constructor(private readonly mailService: IMailService) { }

    private isValidEmail(email?: string): boolean {
        if (!email) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    parseText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, fromEmail, tone, language, length } = req.body;
            if (!text) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }
            const parsedData = await this.mailService.parseTextToEmail(text, fromEmail, tone, language, length);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.MAIL_PARSED, data: parsedData });
        } catch (error: any) {
            console.error("ParseText Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR_PARSE, data: null });
        }
    };

    // POST /api/v1/mail/ai/suggest-subjects
    suggestSubjects = async (req: Request, res: Response): Promise<void> => {
        try {
            const { body } = req.body;
            if (!body) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }
            const subjects = await this.mailService.suggestSubjects(body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Subjects suggested", data: subjects });
        } catch (error: any) {
            console.error("SuggestSubjects Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to suggest subjects", data: null });
        }
    };

    // POST /api/v1/mail/send
    sendEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { to, from, cc, bcc, subject, content, googleAccessToken, tone, language } = req.body;
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const refreshToken = user?.refreshToken;

            if (!userId) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized: Could not identify user.", data: null });
                return;
            }
            if (!to || !from || !subject || !content) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }
            if (!this.isValidEmail(to) || !this.isValidEmail(from) || !this.isValidEmail(cc) || !this.isValidEmail(bcc)) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid email format in to/from/cc/bcc.", data: null });
                return;
            }

            const sentMail = await this.mailService.sendEmail(
                { userId, to, from, cc, bcc, subject, content, tone, language, status: "PENDING" },
                googleAccessToken,
                refreshToken
            );
            res.set("Cache-Control", "no-store");
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MESSAGES.MAIL_SENT, data: sentMail });
        } catch (error: any) {
            console.error("SendEmail Controller Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || MESSAGES.ERROR_SENDING, data: null });
        }
    };

    // GET /api/v1/mail/history
    getHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized: Could not identify user.", data: null });
                return;
            }
            const history = await this.mailService.getUserEmails(userId);
            res.set("Cache-Control", "no-store, no-cache, must-revalidate");
            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.SUCCESS, data: history });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR, data: null });
        }
    };

    // GET /api/v1/mail/gmail/analytics
    getGmailAnalytics = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const refreshToken = user?.refreshToken;
            if (!refreshToken) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "No Google refresh token found.", data: null });
                return;
            }
            const analytics = await this.mailService.getGmailAnalytics(refreshToken);
            res.set("Cache-Control", "no-store");
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Analytics fetched", data: analytics });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || "Failed to fetch Gmail analytics.", data: null });
        }
    };

    // GET /api/v1/mail/check-replies
    checkReplies = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const refreshToken = user?.refreshToken;
            if (!userId || !refreshToken) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized", data: null });
                return;
            }
            await this.mailService.checkReplies(userId, refreshToken);
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Reply check complete", data: null });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to check replies", data: null });
        }
    };

    // ── Templates ────────────────────────────────────────────────────────────
    // POST /api/v1/templates
    createTemplate = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) { res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized", data: null }); return; }
            const { name, to, subject, body } = req.body;
            if (!name) { res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Template name is required", data: null }); return; }
            const template = await this.mailService.createTemplate({ userId, name, to: to || "", subject: subject || "", body: body || "" });
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: "Template saved", data: template });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to save template", data: null });
        }
    };

    // GET /api/v1/templates
    getTemplates = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) { res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized", data: null }); return; }
            const templates = await this.mailService.getTemplates(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Templates fetched", data: templates });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to fetch templates", data: null });
        }
    };

    // DELETE /api/v1/templates/:id
    deleteTemplate = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const id = String(req.params.id || "");
            if (!userId) { res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized", data: null }); return; }
            if (!id) { res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Template id is required", data: null }); return; }
            const deleted = await this.mailService.deleteTemplate(id, userId);
            if (!deleted) { res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Template not found", data: null }); return; }
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Template deleted", data: null });
        } catch (error: any) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to delete template", data: null });
        }
    };

    // ── Read Receipt ─────────────────────────────────────────────────────────
    // GET /api/v1/track/open?id=:mailId  (PUBLIC — no auth)
    trackOpen = async (req: Request, res: Response): Promise<void> => {
        const rawId = req.query.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        if (id && typeof id === "string") {
            try {
                await this.mailService.trackOpen(id);
            } catch {
                // silently ignore
            }
        }
        // Return 1×1 transparent GIF
        const pixel = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );
        res.set({ "Content-Type": "image/gif", "Content-Length": pixel.length.toString(), "Cache-Control": "no-store" });
        res.status(200).end(pixel);
    };
}
