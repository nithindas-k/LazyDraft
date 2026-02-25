export interface IMailEntity {
    id?: string;
    userId: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    status: "SENT" | "FAILED" | "PENDING";
    createdAt?: Date;
}

export interface IMailRepository {
    create(mail: IMailEntity): Promise<IMailEntity>;
    findById(id: string): Promise<IMailEntity | null>;
    findByUserId(userId: string): Promise<IMailEntity[]>;
    updateStatus(id: string, status: "SENT" | "FAILED"): Promise<IMailEntity | null>;
}
