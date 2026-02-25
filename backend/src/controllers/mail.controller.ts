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

    // POST /api/v1/mail/send
    sendEmail = async (req: Request, res: Response): Promise<void> => {
        try {
            const { to, from, subject, content, googleAccessToken } = req.body;
            const userId = (req as any).user?.id || "mock-user-id";

            console.log(`Controller: sendEmail request from=${from} to=${to} hasToken=${!!googleAccessToken}`);

            if (!to || !from || !subject || !content) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: MESSAGES.VALIDATION_ERROR, data: null });
                return;
            }

            const sentMail = await this.mailService.sendEmail(
                { userId, to, from, subject, content, status: "PENDING" },
                googleAccessToken
            );
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
            const userId = (req as any).user?.id || "mock-user-id";
            const history = await this.mailService.getUserEmails(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.SUCCESS, data: history });
        } catch (error: any) {
            console.error("GetHistory Error:", error.message);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR, data: null });
        }
    };
}
