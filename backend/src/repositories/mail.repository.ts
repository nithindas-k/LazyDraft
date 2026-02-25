import { IMailRepository, IMailEntity } from "../interfaces/repositories/IMailRepository";
// import MailModel from "../models/MailModel"; // Mongoose model (to be implemented)

export class MongoMailRepository implements IMailRepository {
    async create(mail: IMailEntity): Promise<IMailEntity> {
      

        console.log("Mock Repo saving mail...", mail);
        return { ...mail, id: "db-id-123", createdAt: new Date() };
    }

    async findById(id: string): Promise<IMailEntity | null> {
        // return await MailModel.findById(id).lean();
        return null; // Mock return
    }

    async findByUserId(userId: string): Promise<IMailEntity[]> {
        // return await MailModel.find({ userId }).lean();
        return []; // Mock return
    }

    async updateStatus(id: string, status: "SENT" | "FAILED" | "PENDING"): Promise<IMailEntity | null> {
        // return await MailModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
        console.log(`Mock Repo updating status of ${id} to ${status}`);
        return { id, userId: "user-foo", to: "test", from: "me", subject: "none", content: "bla", status };
    }
}
