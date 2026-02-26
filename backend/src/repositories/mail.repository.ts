import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
import { Mail } from "../models/MailModel";

function toEntity(mail: any): IMailEntity {
    return {
        id: mail._id.toString(),
        userId: mail.userId,
        from: mail.from,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        subject: mail.subject,
        content: mail.content,
        status: mail.status,
        tone: mail.tone,
        language: mail.language,
        scheduledAt: mail.scheduledAt,
        openedAt: mail.openedAt,
        repliedAt: mail.repliedAt,
        createdAt: mail.createdAt,
    };
}

export class MongoMailRepository implements IMailRepository {
    async create(mail: IMailEntity): Promise<IMailEntity> {
        const newMail = new Mail({
            userId: mail.userId,
            from: mail.from,
            to: mail.to,
            cc: mail.cc,
            bcc: mail.bcc,
            subject: mail.subject,
            content: mail.content,
            status: mail.status || "PENDING",
            tone: mail.tone,
            language: mail.language,
            scheduledAt: mail.scheduledAt,
        });
        const savedMail = await newMail.save();
        return toEntity(savedMail.toObject());
    }

    async findById(id: string): Promise<IMailEntity | null> {
        const mail = await Mail.findById(id).lean();
        if (!mail) return null;
        return toEntity(mail);
    }

    async findByUserId(userId: string): Promise<IMailEntity[]> {
        const mails = await Mail.find({ userId }).sort({ createdAt: -1 }).lean();
        return mails.map(toEntity);
    }

    async findDueScheduled(now: Date, limit = 20): Promise<IMailEntity[]> {
        const mails = await Mail.find({
            status: "PENDING",
            scheduledAt: { $lte: now, $ne: null },
        })
            .sort({ scheduledAt: 1 })
            .limit(limit)
            .lean();
        return mails.map(toEntity);
    }

    async updateStatus(id: string, status: "SENT" | "FAILED" | "PENDING"): Promise<IMailEntity | null> {
        const mail = await Mail.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!mail) return null;
        return toEntity(mail);
    }

    async markOpened(id: string): Promise<void> {
        await Mail.findByIdAndUpdate(id, { openedAt: new Date() });
    }

    async markReplied(id: string): Promise<void> {
        await Mail.findByIdAndUpdate(id, { repliedAt: new Date() });
    }
}
