export interface IEmailPayload {
    to: string;
    from: string;
    cc?: string;
    bcc?: string;
    subject: string;
    text: string;
    html?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface IEmailVendor {
    sendEmail(payload: IEmailPayload): Promise<boolean>;
}
