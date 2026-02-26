export interface ITemplateEntity {
    id?: string;
    userId: string;
    name: string;
    to: string;
    subject: string;
    body: string;
    createdAt?: Date;
}

export interface ITemplateRepository {
    create(template: ITemplateEntity): Promise<ITemplateEntity>;
    findByUserId(userId: string): Promise<ITemplateEntity[]>;
    deleteById(id: string, userId: string): Promise<boolean>;
}
