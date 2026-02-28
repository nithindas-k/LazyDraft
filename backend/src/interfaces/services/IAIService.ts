export interface IAIParsedMail {
    from: string;
    to: string;
    subject: string;
    body: string;
}

export interface IAutoReplyInput {
    subject: string;
    body: string;
    sender: string;
    recipientName?: string;
    tone?: string;
    policy?: string;
}

export interface IAIService {
    parseUnstructuredText(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail>;
    suggestSubjects(body: string): Promise<string[]>;
    generateAutoReply(input: IAutoReplyInput): Promise<string>;
}
