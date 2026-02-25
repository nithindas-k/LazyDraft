export interface IAIParsedMail {
    from: string;
    to: string;
    subject: string;
    body: string;
}

export interface IAIService {
    parseUnstructuredText(text: string, fromEmail?: string): Promise<IAIParsedMail>;
}
