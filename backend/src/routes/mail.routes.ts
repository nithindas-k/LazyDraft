import { Router } from "express";
import { MailController } from "../controllers/mail.controller";
import { API_ROUTES } from "../constants/routes";

export class MailRoutes {
    public router: Router;
    private mailController: MailController;

    constructor(controller: MailController) {
        this.router = Router();
        this.mailController = controller;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.PARSE, this.mailController.parseText);

        this.router.post(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.SEND, this.mailController.sendEmail);

        this.router.get(API_ROUTES.MAIL.BASE + API_ROUTES.MAIL.HISTORY, this.mailController.getHistory);
    }
}
