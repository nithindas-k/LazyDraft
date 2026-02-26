export const API_ROUTES = {
    BASE: "/api/v1",
    MAIL: {
        BASE: "/mail",
        PARSE: "/ai/parse",
        SUGGEST_SUBJECTS: "/ai/suggest-subjects",
        SEND: "/send",
        HISTORY: "/history",
        ANALYTICS: "/gmail/analytics",
        CHECK_REPLIES: "/check-replies",
    },
    TEMPLATES: {
        BASE: "/templates",
        BY_ID: "/:id",
    },
    TRACK: {
        BASE: "/track",
        OPEN: "/open",
    },
    RECURRING_MAILS: {
        BASE: "/recurring-mails",
        BY_ID: "/:id",
        TOGGLE: "/:id/toggle",
        RUN_NOW: "/:id/run-now",
    },
    AUTH: {
        BASE: "/auth",
        LOGIN: "/login",
        REGISTER: "/register",
        VERIFY_OTP: "/verify-otp",
        GOOGLE: "/google",
    },
} as const;
