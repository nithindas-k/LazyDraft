import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";

const LoginPage: React.FC = () => {
    const { user, loading, loginWithGoogle } = useAuth();
    const navigate = useNavigate();


    const features = [
        {
            icon: Sparkles,
            title: "AI-Powered Drafting",
            desc: "Generate professional emails from brief notes in seconds.",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            desc: "Skip the blank page. Get straight to editing and sending.",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            icon: ShieldCheck,
            title: "Secure & Private",
            desc: "Your data is encrypted. We respect your inbox privacy.",
            color: "text-green-500",
            bg: "bg-green-500/10",
        }
    ];

    // Auto-redirect if somehow already logged in
    useEffect(() => {
        if (user) {
            navigate("/user/dashboard", { replace: true });
        }
    }, [user, navigate]);


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-100">
            {/* Left Side: Branding and Features */}
            <div className="flex-1 bg-white p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden border-r border-slate-100">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="max-w-xl mx-auto z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 mb-10">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">
                                LazyDraft
                            </span>
                        </div>

                        {/* Title & Subtitle */}
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
                            Write emails faster with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span>.
                        </h1>
                        <p className="text-lg text-slate-500 mb-12 max-w-md leading-relaxed">
                            Stop staring at a blank screen. Let LazyDraft turn your quick thoughts into polished, ready-to-send emails.
                        </p>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.15 }
                            }
                        }}
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={{
                                    hidden: { opacity: 0, x: -20 },
                                    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
                                }}
                                className="flex items-start gap-4"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feature.bg}`}>
                                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{feature.title}</h3>
                                    <p className="text-slate-500 leading-relaxed text-sm lg:text-base">
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-slate-50 relative">
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/70 backdrop-blur-xl">
                        <CardContent className="p-10">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                                <p className="text-slate-500 text-sm">Sign in to continue to your dashboard</p>
                            </div>

                            {/* Google Sign In Button */}
                            <Button
                                onClick={loginWithGoogle}
                                disabled={loading}
                                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3 font-medium text-base rounded-xl group relative overflow-hidden"
                            >
                                {/* Google "G" SVG */}
                                <svg className="w-5 h-5 bg-white rounded-full flex-shrink-0 z-10 relative group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                <span className="z-10 relative">
                                    {loading ? "Connecting..." : "Continue with Google"}
                                </span>
                            </Button>

                            <div className="mt-8 text-center text-xs text-slate-400">
                                By signing in, you agree to our{" "}
                                <Link to={APP_ROUTES.TERMS} className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link to={APP_ROUTES.PRIVACY} className="text-slate-600 hover:text-slate-900 underline underline-offset-2">
                                    Privacy Policy
                                </Link>
                                .
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
