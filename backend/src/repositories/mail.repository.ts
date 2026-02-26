import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
import { Mail } from "../models/MailModel";

export class MongoMailRepository implements IMailRepository {
    async create(mail: IMailEntity): Promise<IMailEntity> {
        const newMail = new Mail({
            userId: mail.userId,
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            content: mail.content,
            status: mail.status || "PENDING",
        });

        const savedMail = await newMail.save();

        return {
            id: savedMail._id.toString(),
            userId: savedMail.userId,
            from: savedMail.from,
            to: savedMail.to,
            subject: savedMail.subject,
            content: savedMail.content,
            status: savedMail.status,
            createdAt: savedMail.createdAt
        };
    }

    async findById(id: string): Promise<IMailEntity | null> {
        const mail = await Mail.findById(id).lean();
        if (!mail) return null;

        return {
            id: mail._id.toString(),
            userId: mail.userId,
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            content: mail.content,
            status: mail.status,
            createdAt: mail.createdAt
        };
    }

    async findByUserId(userId: string): Promise<IMailEntity[]> {
        const mails = await Mail.find({ userId }).sort({ createdAt: -1 }).lean();
        return mails.map(mail => ({
            id: mail._id.toString(),
            userId: mail.userId,
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            content: mail.content,
            status: mail.status,
            createdAt: mail.createdAt
        }));
    }

    async updateStatus(id: string, status: "SENT" | "FAILED" | "PENDING"): Promise<IMailEntity | null> {
        const mail = await Mail.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!mail) return null;

        return {
            id: mail._id.toString(),
            userId: mail.userId,
            from: mail.from,
            to: mail.to,
            subject: mail.subject,
            content: mail.content,
            status: mail.status,
            createdAt: mail.createdAt
        };
    }
}
