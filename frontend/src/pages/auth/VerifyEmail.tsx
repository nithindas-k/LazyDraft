import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "@/api/axios.instance";
import { APP_ROUTES } from "@/constants/routes";

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing verification token.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await axiosInstance.post("/auth/verify-email", { token });
                if (response.data.success) {
                    setStatus("success");
                    setMessage("Your email has been successfully verified! You can now use all features of LazyDraft.");
                } else {
                    setStatus("error");
                    setMessage(response.data.message || "Email verification failed.");
                }
            } catch (error: any) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Something went wrong during verification.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full shadow-lg border-0 rounded-2xl overflow-hidden">
                {/* Top colored stripe */}
                <div
                    className={`h-2 w-full ${status === "loading" ? "bg-blue-500" :
                            status === "success" ? "bg-green-500" : "bg-red-500"
                        }`}
                />

                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-slate-800">Email Verification</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center p-8 pt-4">
                    {status === "loading" && (
                        <div className="flex flex-col items-center text-center gap-4">
                            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                            <p className="text-slate-600 text-sm">{message}</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
                            <Button
                                className="mt-6 w-full text-white bg-slate-900 rounded-xl"
                                onClick={() => navigate(APP_ROUTES.USER.DASHBOARD)}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
                            <Button
                                className="mt-6 w-full text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                                onClick={() => navigate(APP_ROUTES.USER.DASHBOARD)}
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;
