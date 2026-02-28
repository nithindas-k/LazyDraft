import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { AutoReplyController } from "../controllers/auto-reply.controller";

export class AutoReplyRoutes {
    public router: Router;
    constructor(private readonly autoReplyController: AutoReplyController) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        const base = "/mail/auto-reply";
        this.router.get(`${base}/settings`, isAuthenticated, this.autoReplyController.getSettings);
        this.router.put(`${base}/settings`, isAuthenticated, this.autoReplyController.updateSettings);
        this.router.get(`${base}/inbound`, isAuthenticated, this.autoReplyController.listInbound);
        this.router.post(`${base}/:mailId/approve`, isAuthenticated, this.autoReplyController.approveDraft);
        this.router.post(`${base}/:mailId/reject`, isAuthenticated, this.autoReplyController.rejectDraft);
        this.router.post(`${base}/run`, isAuthenticated, this.autoReplyController.runNow);
    }
}
