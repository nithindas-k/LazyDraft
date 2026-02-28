import { IMailEntity } from "./IMailRepository";

export interface IAutoReplyRepository {
    findInboundForReview(userId: string, limit?: number): Promise<IMailEntity[]>;
    findByProviderMessageId(providerMessageId: string, userId: string): Promise<IMailEntity | null>;
    findRecentAutoReplyByThread(userId: string, providerThreadId: string, since: Date): Promise<IMailEntity | null>;
    create(mail: IMailEntity): Promise<IMailEntity>;
    updateAutoReplyResult(id: string, status: "SKIPPED" | "DRAFTED" | "SENT" | "BLOCKED", reason?: string): Promise<void>;
    markAutoReplied(id: string): Promise<void>;
    findById(id: string): Promise<IMailEntity | null>;
}
