export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const APP_ROUTES = {
    HOME: "/",
    VERIFY_EMAIL: "/verify-email",
    USER: {
        DASHBOARD: "/user/dashboard",
        MAIL_SENDER: "/user/mail/sender",
        HISTORY: "/user/mail/history",
        SETTINGS: "/user/settings",
    },
    ADMIN: {
        DASHBOARD: "/admin/dashboard",
        MESSAGES: "/admin/messages",
    },
};

export const API_ENDPOINTS = {
    MAIL: {
        PARSE: "/v1/mail/ai/parse",
        SEND: "/v1/mail/send",
        HISTORY: "/v1/mail/history",
        ANALYTICS: "/v1/mail/gmail/analytics",
    },
};

