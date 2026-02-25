import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MagicFillForm } from "@/components/user/MagicFillForm";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const MailSenderPage: React.FC = () => (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Mail Sender</h1>
                <p className="text-slate-500 mt-1 text-sm">
                    Let AI draft your email, then send it directly from your Gmail.
                </p>
            </div>
            <MagicFillForm />
        </div>
    </GoogleOAuthProvider>
);

export default MailSenderPage;
