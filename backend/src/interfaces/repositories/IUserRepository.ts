export interface IUserEntity {
    id?: string;
    email: string;
    name: string;
    authProvider: "GOOGLE" | "LOCAL";
    isVerified: boolean;
}

export interface IUserRepository {
    create(user: IUserEntity): Promise<IUserEntity>;
    findByEmail(email: string): Promise<IUserEntity | null>;
    findById(id: string): Promise<IUserEntity | null>;
    verifyUser(id: string): Promise<void>;
}
