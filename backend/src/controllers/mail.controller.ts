import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/statusCodes";
import { MESSAGES } from "../constants/messages";
import { IMailService } from "../interfaces/services/IMailService";

export class MailController {
    constructor(private readonly mailService: IMailService) { }

    // POST /api/v1/mail/ai/parse
    parseText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, fromEmail } = req.body;
            if (!text) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }
            const parsedData = await this.mailService.parseTextToEmail(text, fromEmail);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.MAIL_PARSED, data: parsedData });
        } catch (error: any) {
            console.error("ParseText Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.ERROR_PARSE, data: null });
        }
    };

    sendEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { to, from, subject, content, googleAccessToken } = req.body;
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const refreshToken = user?.refreshToken;

            if (!userId) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Unauthorized: Could not identify user.", data: null });
                return;
            }

            console.log(`Controller: sendEmail request from=${from} to=${to} userId=${userId} hasToken=${!!googleAccessToken}`);

            if (!to || !from || !subject || !content) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }

            const sentMail = await this.mailService.sendEmail(
                { userId, to, from, subject, content, status: "PENDING" },
                googleAccessToken,
                refreshToken
            );
            res.set("Cache-Control", "no-store");
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: MESSAGES.MAIL_SENT, data: sentMail });
        } catch (error: any) {
            console.error("SendEmail Controller Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || MESSAGES.ERROR_SENDING,
                data: null
            });
        }
    };

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
            console.error("GetHistory Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR, data: null });
        }
    };

    getGmailAnalytics = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const refreshToken = user?.refreshToken;

            if (!refreshToken) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "No Google refresh token found. Please reconnect your Gmail account.", data: null });
                return;
            }

            const analytics = await this.mailService.getGmailAnalytics(refreshToken);
            res.set("Cache-Control", "no-store");
            res.status(HTTP_STATUS.OK).json({ success: true, message: "Analytics fetched", data: analytics });
        } catch (error: any) {
            console.error("GetGmailAnalytics Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || "Failed to fetch Gmail analytics.", data: null });
        }
    };
}

