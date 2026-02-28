import { IMailEntity } from "../repositories/IMailRepository";

export interface IAutoReplySettings {
    autoReplyEnabled: boolean;
    autoReplyMode: "manual" | "auto";
    autoReplySignature: string;
    autoReplyCooldownMinutes: number;
    gmailLastProcessedAt?: Date;
}

export interface IAutoReplyMailDetails {
    inbound: IMailEntity;
    autoReply: IMailEntity | null;
}

export interface IAutoReplyUpdateInput {
    autoReplyEnabled?: boolean;
    autoReplyMode?: "manual" | "auto";
    autoReplySignature?: string;
    autoReplyCooldownMinutes?: number;
}

export interface IAutoReplyService {
    getSettings(userId: string): Promise<IAutoReplySettings>;
    updateSettings(userId: string, input: IAutoReplyUpdateInput): Promise<IAutoReplySettings>;
    listInbound(userId: string, limit?: number): Promise<IMailEntity[]>;
    getMailDetails(userId: string, mailId: string): Promise<IAutoReplyMailDetails>;
    approveDraft(userId: string, mailId: string): Promise<void>;
    rejectDraft(userId: string, mailId: string, reason?: string): Promise<void>;
    runForUser(userId: string): Promise<{ processed: number }>;
    runForEnabledUsers(): Promise<void>;
}
