import { IMailEntity } from "../repositories/IMailRepository";
import { IAIParsedMail } from "./IAIService";
import { IGmailAnalytics } from "../../vendors/GmailVendor";
import { ITemplateEntity } from "../repositories/ITemplateRepository";
import { IRecurringMailEntity } from "../repositories/IRecurringMailRepository";

export interface IMailService {
    parseTextToEmail(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail>;
    sendEmail(mailData: IMailEntity, googleAccessToken?: string, refreshToken?: string, trackingBaseUrl?: string): Promise<IMailEntity>;
    processScheduledEmails(trackingBaseUrl?: string): Promise<void>;
    getUserEmails(userId: string): Promise<IMailEntity[]>;
    getGmailAnalytics(refreshToken: string): Promise<IGmailAnalytics>;
    suggestSubjects(body: string): Promise<string[]>;
    createTemplate(template: ITemplateEntity): Promise<ITemplateEntity>;
    getTemplates(userId: string): Promise<ITemplateEntity[]>;
    deleteTemplate(id: string, userId: string): Promise<boolean>;
    trackOpen(mailId: string): Promise<void>;
    checkReplies(userId: string, refreshToken: string): Promise<void>;
    createRecurringMail(data: IRecurringMailEntity): Promise<IRecurringMailEntity>;
    getRecurringMails(userId: string): Promise<IRecurringMailEntity[]>;
    updateRecurringMail(id: string, userId: string, data: Partial<IRecurringMailEntity>): Promise<IRecurringMailEntity | null>;
    deleteRecurringMail(id: string, userId: string): Promise<boolean>;
    toggleRecurringMail(id: string, userId: string): Promise<IRecurringMailEntity | null>;
    runRecurringNow(id: string, userId: string): Promise<void>;
    processRecurringMails(): Promise<void>;
}
