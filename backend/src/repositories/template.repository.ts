import { ITemplateRepository, ITemplateEntity } from "../interfaces/repositories/ITemplateRepository";
import { Template } from "../models/TemplateModel";

export class MongoTemplateRepository implements ITemplateRepository {
    async create(t: ITemplateEntity): Promise<ITemplateEntity> {
        const doc = await new Template({
            userId: t.userId,
            name: t.name,
            to: t.to,
            subject: t.subject,
            body: t.body,
        }).save();
        return {
            id: doc._id.toString(),
            userId: doc.userId,
            name: doc.name,
            to: doc.to,
            subject: doc.subject,
            body: doc.body,
            createdAt: doc.createdAt,
        };
    }

    async findByUserId(userId: string): Promise<ITemplateEntity[]> {
        const docs = await Template.find({ userId }).sort({ createdAt: -1 }).lean();
        return docs.map(d => ({
            id: d._id.toString(),
            userId: d.userId,
            name: d.name,
            to: d.to,
            subject: d.subject,
            body: d.body,
            createdAt: d.createdAt,
        }));
    }

    async deleteById(id: string, userId: string): Promise<boolean> {
        const result = await Template.findOneAndDelete({ _id: id, userId });
        return result !== null;
    }
}
