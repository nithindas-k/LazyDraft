import { IMailEntity } from "../repositories/IMailRepository";
import { IAIParsedMail } from "./IAIService";
import { IGmailAnalytics } from "../../vendors/GmailVendor";

export interface IMailService {
    parseTextToEmail(text: string, fromEmail?: string): Promise<IAIParsedMail>;
    sendEmail(mailData: IMailEntity, googleAccessToken?: string, refreshToken?: string): Promise<IMailEntity>;
    getUserEmails(userId: string): Promise<IMailEntity[]>;
    getGmailAnalytics(refreshToken: string): Promise<IGmailAnalytics>;
}

