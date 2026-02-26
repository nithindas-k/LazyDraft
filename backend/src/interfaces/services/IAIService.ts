export interface IAIParsedMail {
    from: string;
    to: string;
    subject: string;
    body: string;
}

export interface IAIService {
    parseUnstructuredText(text: string, fromEmail?: string, tone?: string, language?: string, length?: string): Promise<IAIParsedMail>;
    suggestSubjects(body: string): Promise<string[]>;
}
