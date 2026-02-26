export interface IMailEntity {
    id?: string;
    userId: string;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    tone?: string;
    language?: string;
    scheduledAt?: Date;
    openedAt?: Date;
    repliedAt?: Date;
    createdAt?: Date;
}

export interface IMailRepository {
    create(mail: IMailEntity): Promise<IMailEntity>;
    findById(id: string): Promise<IMailEntity | null>;
    findByUserId(userId: string): Promise<IMailEntity[]>;
    findDueScheduled(now: Date, limit?: number): Promise<IMailEntity[]>;
    updateStatus(id: string, status: "SENT" | "FAILED" | "PENDING"): Promise<IMailEntity | null>;
    markOpened(id: string): Promise<void>;
    markReplied(id: string): Promise<void>;
}
