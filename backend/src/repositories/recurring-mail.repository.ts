import { IRecurringMailEntity, IRecurringMailRepository } from "../interfaces/repositories/IRecurringMailRepository";
import { RecurringMail } from "../models/RecurringMailModel";

function toEntity(doc: any): IRecurringMailEntity {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        name: doc.name,
        from: doc.from,
        to: doc.to || [],
        cc: doc.cc || [],
        bcc: doc.bcc || [],
        subject: doc.subject,
        content: doc.content,
        daysOfWeek: doc.daysOfWeek || [],
        timeOfDay: doc.timeOfDay,
        timezone: doc.timezone,
        isActive: doc.isActive,
        lastSentAt: doc.lastSentAt,
        nextRunAt: doc.nextRunAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

export class MongoRecurringMailRepository implements IRecurringMailRepository {
    async create(data: IRecurringMailEntity): Promise<IRecurringMailEntity> {
        const saved = await new RecurringMail(data).save();
        return toEntity(saved.toObject());
    }

    async findByUserId(userId: string): Promise<IRecurringMailEntity[]> {
        const docs = await RecurringMail.find({ userId }).sort({ createdAt: -1 }).lean();
        return docs.map(toEntity);
    }

    async findByIdAndUser(id: string, userId: string): Promise<IRecurringMailEntity | null> {
        const doc = await RecurringMail.findOne({ _id: id, userId }).lean();
        return doc ? toEntity(doc) : null;
    }

    async updateByIdAndUser(id: string, userId: string, data: Partial<IRecurringMailEntity>): Promise<IRecurringMailEntity | null> {
        const doc = await RecurringMail.findOneAndUpdate({ _id: id, userId }, data, { new: true }).lean();
        return doc ? toEntity(doc) : null;
    }

    async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
        const result = await RecurringMail.findOneAndDelete({ _id: id, userId });
        return result !== null;
    }

    async findDueActive(now: Date, limit = 20): Promise<IRecurringMailEntity[]> {
        const docs = await RecurringMail.find({
            isActive: true,
            nextRunAt: { $lte: now },
        })
            .sort({ nextRunAt: 1 })
            .limit(limit)
            .lean();
        return docs.map(toEntity);
    }
}
