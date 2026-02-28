import { Request, Response } from "express";
import { IAutoReplyService } from "../interfaces/services/IAutoReplyService";

export class AutoReplyController {
    constructor(private readonly autoReplyService: IAutoReplyService) {}

    getSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized", data: null });
                return;
            }
            const data = await this.autoReplyService.getSettings(userId);
            res.status(200).json({ success: true, message: "Auto-reply settings fetched", data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to fetch settings", data: null });
        }
    };

    updateSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized", data: null });
                return;
            }
            const data = await this.autoReplyService.updateSettings(userId, req.body || {});
            res.status(200).json({ success: true, message: "Auto-reply settings updated", data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to update settings", data: null });
        }
    };

    listInbound = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized", data: null });
                return;
            }
            const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
            const data = await this.autoReplyService.listInbound(userId, limit);
            res.status(200).json({ success: true, message: "Inbound mails fetched", data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to fetch inbound mails", data: null });
        }
    };

    getMailDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const mailId = String(req.params.mailId || "");
            if (!userId || !mailId) {
                res.status(400).json({ success: false, message: "Invalid request", data: null });
                return;
            }
            const data = await this.autoReplyService.getMailDetails(userId, mailId);
            res.status(200).json({ success: true, message: "Auto-reply mail details fetched", data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to fetch mail details", data: null });
        }
    };

    approveDraft = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const mailId = String(req.params.mailId || "");
            if (!userId || !mailId) {
                res.status(400).json({ success: false, message: "Invalid request", data: null });
                return;
            }
            await this.autoReplyService.approveDraft(userId, mailId);
            res.status(200).json({ success: true, message: "Draft approved and sent", data: null });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to approve draft", data: null });
        }
    };

    rejectDraft = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            const mailId = String(req.params.mailId || "");
            if (!userId || !mailId) {
                res.status(400).json({ success: false, message: "Invalid request", data: null });
                return;
            }
            await this.autoReplyService.rejectDraft(userId, mailId, req.body?.reason);
            res.status(200).json({ success: true, message: "Draft rejected", data: null });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to reject draft", data: null });
        }
    };

    runNow = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const userId = user?._id?.toString() || user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized", data: null });
                return;
            }
            const data = await this.autoReplyService.runForUser(userId);
            res.status(200).json({ success: true, message: "Auto-reply run complete", data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error?.message || "Failed to run auto-reply", data: null });
        }
    };
}
