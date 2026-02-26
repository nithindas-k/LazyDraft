export const API_ROUTES = {
    BASE: "/api/v1",
    MAIL: {
        BASE: "/mail",
        PARSE: "/ai/parse",
        SEND: "/send",
        HISTORY: "/history",
        ANALYTICS: "/gmail/analytics",
    },
    AUTH: {
        BASE: "/auth",
        LOGIN: "/login",
        REGISTER: "/register",
        VERIFY_OTP: "/verify-otp",
        GOOGLE: "/google",
    },
} as const;
