export interface IRecurringMailEntity {
    id?: string;
    userId: string;
    name: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    content: string;
    daysOfWeek: number[];
    timeOfDay: string; // HH:mm
    timezone: string; // IANA timezone
    isActive: boolean;
    lastSentAt?: Date;
    nextRunAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IRecurringMailRepository {
    create(data: IRecurringMailEntity): Promise<IRecurringMailEntity>;
    findByUserId(userId: string): Promise<IRecurringMailEntity[]>;
    findByIdAndUser(id: string, userId: string): Promise<IRecurringMailEntity | null>;
    updateByIdAndUser(id: string, userId: string, data: Partial<IRecurringMailEntity>): Promise<IRecurringMailEntity | null>;
    deleteByIdAndUser(id: string, userId: string): Promise<boolean>;
    findDueActive(now: Date, limit?: number): Promise<IRecurringMailEntity[]>;
}
