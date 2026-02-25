import axiosInstance from "@/api/axios.instance";
import { API_ENDPOINTS } from "@/constants/routes";

export interface ParsedEmailData {
    from: string;
    to: string;
    subject: string;
    body: string;
}

export interface SendEmailPayload {
    to: string;
    from: string;
    subject: string;
    content: string;
    googleAccessToken?: string | null;
}

export const MailService = {
    async parseMagicFill(text: string, fromEmail?: string | null): Promise<{ success: boolean; data: ParsedEmailData }> {
        return axiosInstance.post(API_ENDPOINTS.MAIL.PARSE, { text, fromEmail });
    },

    async sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
        return axiosInstance.post(API_ENDPOINTS.MAIL.SEND, payload);
    },

    async getHistory(): Promise<{ success: boolean; data: any[] }> {
        return axiosInstance.get(API_ENDPOINTS.MAIL.HISTORY);
    },
};
