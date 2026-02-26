import { IMailEntity } from "../repositories/IMailRepository";
import { IAIParsedMail } from "./IAIService";
import { IGmailAnalytics } from "../../vendors/GmailVendor";
import { ITemplateEntity } from "../repositories/ITemplateRepository";

export interface IMailService {
    parseTextToEmail(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail>;
    sendEmail(mailData: IMailEntity, googleAccessToken?: string, refreshToken?: string, trackingBaseUrl?: string): Promise<IMailEntity>;
    getUserEmails(userId: string): Promise<IMailEntity[]>;
    getGmailAnalytics(refreshToken: string): Promise<IGmailAnalytics>;
    suggestSubjects(body: string): Promise<string[]>;
    createTemplate(template: ITemplateEntity): Promise<ITemplateEntity>;
    getTemplates(userId: string): Promise<ITemplateEntity[]>;
    deleteTemplate(id: string, userId: string): Promise<boolean>;
    trackOpen(mailId: string): Promise<void>;
    checkReplies(userId: string, refreshToken: string): Promise<void>;
}
