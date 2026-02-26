import { Router } from "express";
import { MailController } from "../controllers/mail.controller";
import { API_ROUTES } from "../constants/routes";
import { isAuthenticated } from "../middlewares/auth.middleware";
import rateLimit from "express-rate-limit";

const trackLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
});

export class MailRoutes {
    public router: Router;
    private mailController: MailController;

    constructor(controller: MailController) {
        this.router = Router();
        this.mailController = controller;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.PARSE, isAuthenticated, this.mailController.parseText);
        this.router.post(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.SUGGEST_SUBJECTS, isAuthenticated, this.mailController.suggestSubjects);
        this.router.post(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.SEND, isAuthenticated, this.mailController.sendEmail);
        this.router.get(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.HISTORY, isAuthenticated, this.mailController.getHistory);
        this.router.get(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.ANALYTICS, isAuthenticated, this.mailController.getGmailAnalytics);
        this.router.get(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.CHECK_REPLIES, isAuthenticated, this.mailController.checkReplies);

        this.router.post(API_ROUTES.TEMPLATES.BASE, isAuthenticated, this.mailController.createTemplate);
        this.router.get(API_ROUTES.TEMPLATES.BASE, isAuthenticated, this.mailController.getTemplates);
        this.router.delete(API_ROUTES.TEMPLATES.BASE + API_ROUTES.TEMPLATES.BY_ID, isAuthenticated, this.mailController.deleteTemplate);

        this.router.get(API_ROUTES.TRACK.BASE + API_ROUTES.TRACK.OPEN, trackLimiter, this.mailController.trackOpen);

        this.router.post(API_ROUTES.RECURRING_MAILS.BASE, isAuthenticated, this.mailController.createRecurringMail);
        this.router.get(API_ROUTES.RECURRING_MAILS.BASE, isAuthenticated, this.mailController.getRecurringMails);
        this.router.patch(API_ROUTES.RECURRING_MAILS.BASE + API_ROUTES.RECURRING_MAILS.BY_ID, isAuthenticated, this.mailController.updateRecurringMail);
        this.router.patch(API_ROUTES.RECURRING_MAILS.BASE + API_ROUTES.RECURRING_MAILS.TOGGLE, isAuthenticated, this.mailController.toggleRecurringMail);
        this.router.delete(API_ROUTES.RECURRING_MAILS.BASE + API_ROUTES.RECURRING_MAILS.BY_ID, isAuthenticated, this.mailController.deleteRecurringMail);
        this.router.post(API_ROUTES.RECURRING_MAILS.BASE + API_ROUTES.RECURRING_MAILS.RUN_NOW, isAuthenticated, this.mailController.runRecurringNow);
    }
}
