import { IAutoReplyRepository } from "../interfaces/repositories/IAutoReplyRepository";
import { IMailEntity, IMailRepository } from "../interfaces/repositories/IMailRepository";

export class AutoReplyRepository implements IAutoReplyRepository {
    constructor(private readonly mailRepository: IMailRepository) {}

    async findInboundForReview(userId: string, limit?: number): Promise<IMailEntity[]> {
        return this.mailRepository.findInboundForReview(userId, limit);
    }

    async findByProviderMessageId(providerMessageId: string, userId: string): Promise<IMailEntity | null> {
        return this.mailRepository.findByProviderMessageId(providerMessageId, userId);
    }

    async findRecentAutoReplyByThread(userId: string, providerThreadId: string, since: Date): Promise<IMailEntity | null> {
        return this.mailRepository.findRecentAutoReplyByThread(userId, providerThreadId, since);
    }

    async create(mail: IMailEntity): Promise<IMailEntity> {
        return this.mailRepository.create(mail);
    }

    async updateAutoReplyResult(id: string, status: "SKIPPED" | "DRAFTED" | "SENT" | "BLOCKED", reason?: string): Promise<void> {
        return this.mailRepository.updateAutoReplyResult(id, status, reason);
    }

    async markAutoReplied(id: string): Promise<void> {
        return this.mailRepository.markAutoReplied(id);
    }

    async findById(id: string): Promise<IMailEntity | null> {
        return this.mailRepository.findById(id);
    }
}
