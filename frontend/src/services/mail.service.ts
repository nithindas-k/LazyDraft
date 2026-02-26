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
    scheduledAt?: string;
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

export interface RecurringMailPayload {
    name: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    content: string;
    daysOfWeek: number[];
    timeOfDay: string;
    timezone: string;
    isActive?: boolean;
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
        const source = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? res : [];
        const normalized = source.map((t: any) => ({
            id: t.id || t._id,
            name: t.name,
            to: t.to,
            subject: t.subject,
            body: t.body,
            createdAt: t.createdAt,
        }));
        return { success: true, data: normalized };
    },

    async createTemplate(payload: TemplatePayload): Promise<{ success: boolean; data: any }> {
        return axiosInstance.post(API_ENDPOINTS.TEMPLATES.BASE, payload);
    },

    async deleteTemplate(id: string): Promise<{ success: boolean }> {
        return axiosInstance.delete(API_ENDPOINTS.TEMPLATES.BY_ID(id));
    },

    async getRecurringMails(): Promise<{ success: boolean; data: any[] }> {
        return axiosInstance.get(API_ENDPOINTS.RECURRING_MAILS.BASE);
    },

    async createRecurringMail(payload: RecurringMailPayload): Promise<{ success: boolean; data: any }> {
        return axiosInstance.post(API_ENDPOINTS.RECURRING_MAILS.BASE, payload);
    },

    async updateRecurringMail(id: string, payload: Partial<RecurringMailPayload>): Promise<{ success: boolean; data: any }> {
        return axiosInstance.patch(API_ENDPOINTS.RECURRING_MAILS.BY_ID(id), payload);
    },

    async toggleRecurringMail(id: string): Promise<{ success: boolean; data: any }> {
        return axiosInstance.patch(API_ENDPOINTS.RECURRING_MAILS.TOGGLE(id));
    },

    async runRecurringNow(id: string): Promise<{ success: boolean }> {
        return axiosInstance.post(API_ENDPOINTS.RECURRING_MAILS.RUN_NOW(id));
    },

    async deleteRecurringMail(id: string): Promise<{ success: boolean }> {
        return axiosInstance.delete(API_ENDPOINTS.RECURRING_MAILS.BY_ID(id));
    },
};
