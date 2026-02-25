import { IMailEntity } from "../repositories/IMailRepository";
import { IAIParsedMail } from "./IAIService";

export interface IMailService {
    parseTextToEmail(text: string, fromEmail?: string): Promise<IAIParsedMail>;
    sendEmail(mailData: IMailEntity, googleAccessToken?: string): Promise<IMailEntity>;
    getUserEmails(userId: string): Promise<IMailEntity[]>;
}
