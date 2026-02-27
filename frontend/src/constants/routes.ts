const configuredApiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
export const API_BASE_URL = configuredApiBase || (import.meta.env.DEV ? "http://localhost:5000/api" : "");

export const APP_ROUTES = {
    HOME: "/",
    VERIFY_EMAIL: "/verify-email",
    USER: {
        DASHBOARD: "/user/dashboard",
        MAIL_SENDER: "/user/mail/sender",
        RECURRING_MAIL: "/user/mail/recurring",
        SERVICES: "/user/services",
        HISTORY: "/user/mail/history",
        SETTINGS: "/user/settings",
        TEMPLATES: "/user/templates",
    },
    ADMIN: {
        DASHBOARD: "/admin/dashboard",
        MESSAGES: "/admin/messages",
    },
};

export const API_ENDPOINTS = {
    MAIL: {
        PARSE: "/v1/mail/ai/parse",
        SUGGEST_SUBJECTS: "/v1/mail/ai/suggest-subjects",
        SEND: "/v1/mail/send",
        HISTORY: "/v1/mail/history",
        ANALYTICS: "/v1/mail/gmail/analytics",
        CHECK_REPLIES: "/v1/mail/check-replies",
    },
    TEMPLATES: {
        BASE: "/v1/templates",
        BY_ID: (id: string) => `/v1/templates/${id}`,
    },
    RECURRING_MAILS: {
        BASE: "/v1/recurring-mails",
        BY_ID: (id: string) => `/v1/recurring-mails/${id}`,
        TOGGLE: (id: string) => `/v1/recurring-mails/${id}/toggle`,
        RUN_NOW: (id: string) => `/v1/recurring-mails/${id}/run-now`,
    },
};
