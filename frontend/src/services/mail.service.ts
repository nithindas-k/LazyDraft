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
    cc?: string;
    bcc?: string;
    subject: string;
    content: string;
    tone?: string;
    language?: string;
    googleAccessToken?: string | null;
}

export interface TemplatePayload {
    name: string;
    to?: string;
    subject?: string;
    body?: string;
}

export interface TemplateItem {
    id: string;
    name: string;
    to?: string;
    subject?: string;
    body?: string;
    createdAt: string;
}

export const MailService = {
    async parseMagicFill(
        text: string,
        fromEmail?: string | null,
        tone?: string,
        language?: string,
        length?: string
    ): Promise<{ success: boolean; data: ParsedEmailData }> {
        return axiosInstance.post(API_ENDPOINTS.MAIL.PARSE, { text, fromEmail, tone, language, length });
    },

    async suggestSubjects(body: string): Promise<{ success: boolean; data: string[] }> {
        return axiosInstance.post(API_ENDPOINTS.MAIL.SUGGEST_SUBJECTS, { body });
    },

    async sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string }> {
        return axiosInstance.post(API_ENDPOINTS.MAIL.SEND, payload);
    },

    async getHistory(): Promise<{ success: boolean; data: any[] }> {
        return axiosInstance.get(`${API_ENDPOINTS.MAIL.HISTORY}?t=${Date.now()}`);
    },

    async getAnalytics(): Promise<{ success: boolean; data: any }> {
        return axiosInstance.get(API_ENDPOINTS.MAIL.ANALYTICS);
    },

    async checkReplies(): Promise<void> {
        return axiosInstance.get(API_ENDPOINTS.MAIL.CHECK_REPLIES);
    },

    // Templates
    async getTemplates(): Promise<{ success: boolean; data: TemplateItem[] }> {
        const res = await axiosInstance.get(API_ENDPOINTS.TEMPLATES.BASE);
        const normalized = (res.data || []).map((t: any) => ({
            id: t.id || t._id,
            name: t.name,
            to: t.to,
            subject: t.subject,
            body: t.body,
            createdAt: t.createdAt,
        }));
        return { ...res, data: normalized };
    },

    async createTemplate(payload: TemplatePayload): Promise<{ success: boolean; data: any }> {
        return axiosInstance.post(API_ENDPOINTS.TEMPLATES.BASE, payload);
    },

    async deleteTemplate(id: string): Promise<{ success: boolean }> {
        return axiosInstance.delete(API_ENDPOINTS.TEMPLATES.BY_ID(id));
    },
};
