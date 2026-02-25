import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wand2, Send, Loader2, CheckCircle2, XCircle, ShieldCheck, Mail } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MailService } from "../../services/mail.service";

// ─── Google Brand Colors ─────────────────────────────────────────────────────
const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";


const mailSchema = z.object({
    from: z.string().email("Invalid sender email"),
    to: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
});
type MailFormValues = z.infer<typeof mailSchema>;

// ─── Send Status Modal ───────────────────────────────────────────────────────
type SendStatus = "idle" | "sending" | "success" | "error";

interface SendDialogProps {
    open: boolean;
    status: SendStatus;
    errorMessage?: string;
    onClose: () => void;
}

// ─── Send Steps Config ───────────────────────────────────────────────────────
const SEND_STEPS = [
    { label: "Authenticating", icon: ShieldCheck },
    { label: "Composing", icon: Mail },
    { label: "Delivering", icon: Send },
];

function SendDialog({ open, status, errorMessage, onClose }: SendDialogProps) {

    // Cycle through steps while sending
    const [stepIndex, setStepIndex] = useState(0);

    React.useEffect(() => {
        if (status !== "sending") { setStepIndex(0); return; }
        const id = setInterval(() =>
            setStepIndex(prev => (prev + 1) % SEND_STEPS.length), 1200);
        return () => clearInterval(id);
    }, [status]);

    /* ── Status-derived tokens ── */
    const accentColor =
        status === "success" ? G_GREEN : status === "error" ? G_RED : G_BLUE;

    const glowStyle = {
        boxShadow: `0 0 0 6px ${accentColor}22, 0 0 0 12px ${accentColor}11`,
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && status !== "sending") onClose(); }}>
            <DialogContent
                className="max-w-[380px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
            >
                {/* ── Colour band at top ── */}
                <motion.div
                    className="h-1 w-full"
                    animate={{ backgroundColor: accentColor }}
                    transition={{ duration: 0.5 }}
                />

                <div className="px-7 py-8 flex flex-col items-center gap-6">
                    <AnimatePresence mode="wait">

                        {/* ════════ SENDING ════════ */}
                        {status === "sending" && (
                            <motion.div
                                key="sending"
                                className="flex flex-col items-center gap-5 w-full"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                            >
                                {/* ── Glowing icon ring ── */}
                                <div className="relative flex items-center justify-center">
                                    {/* Outer pulse ring */}
                                    <motion.div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 88, height: 88,
                                            background: `radial-gradient(circle, ${G_BLUE}33 0%, transparent 70%)`,
                                        }}
                                        animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.3, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    {/* Icon circle */}
                                    <motion.div
                                        className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white border border-slate-100"
                                        style={glowStyle}
                                        animate={{ borderColor: [G_BLUE, G_RED, G_YELLOW, G_GREEN, G_BLUE] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    >
                                        <AnimatePresence mode="wait">
                                            {SEND_STEPS.map((step, i) =>
                                                i === stepIndex ? (
                                                    <motion.div
                                                        key={step.label}
                                                        initial={{ opacity: 0, rotate: -15, scale: 0.7 }}
                                                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                        exit={{ opacity: 0, rotate: 15, scale: 0.7 }}
                                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                                    >
                                                        <step.icon
                                                            className="w-7 h-7"
                                                            style={{ color: G_BLUE }}
                                                        />
                                                    </motion.div>
                                                ) : null
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>

                                {/* ── Text ── */}
                                <div className="text-center space-y-1">
                                    <DialogTitle className="text-base font-semibold text-slate-800">
                                        Sending your email…
                                    </DialogTitle>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={stepIndex}
                                            className="text-xs font-medium tracking-wide uppercase"
                                            style={{ color: G_BLUE }}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            {SEND_STEPS[stepIndex].label}
                                        </motion.p>
                                    </AnimatePresence>
                                    <DialogDescription className="text-sm text-slate-400">
                                        Please wait while we deliver via Gmail.
                                    </DialogDescription>
                                </div>

                                {/* ── Google-colour gradient progress bar ── */}
                                <div className="w-full space-y-2">
                                    <Progress className="h-1.5 w-full rounded-full" value={undefined} />

                                    {/* ── Step indicators ── */}
                                    <div className="flex justify-between px-1">
                                        {SEND_STEPS.map((step, i) => (
                                            <div key={step.label} className="flex flex-col items-center gap-1">
                                                <motion.div
                                                    className="w-2 h-2 rounded-full"
                                                    animate={{
                                                        backgroundColor: i <= stepIndex ? G_BLUE : "#e2e8f0",
                                                        scale: i === stepIndex ? 1.4 : 1,
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                                <span className={`text-[10px] font-medium ${i <= stepIndex ? "text-slate-600" : "text-slate-300"}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Bouncing Google-colour dots ── */}
                                <div className="flex gap-2 justify-center pt-1">
                                    {[G_BLUE, G_RED, G_YELLOW, G_GREEN].map((c, i) => (
                                        <motion.span
                                            key={i}
                                            className="block w-2 h-2 rounded-full"
                                            style={{ backgroundColor: c }}
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{
                                                duration: 0.7,
                                                ease: "easeInOut",
                                                repeat: Infinity,
                                                delay: i * 0.12,
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ════════ SUCCESS ════════ */}
                        {status === "success" && (
                            <motion.div
                                key="success"
                                className="flex flex-col items-center gap-5 w-full"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                            >
                                {/* ── Glowing success ring ── */}
                                <div className="relative flex items-center justify-center">
                                    <motion.div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 88, height: 88,
                                            background: `radial-gradient(circle, ${G_GREEN}44 0%, transparent 70%)`,
                                        }}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                    <motion.div
                                        className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white"
                                        style={{
                                            border: `2px solid ${G_GREEN}`,
                                            boxShadow: `0 0 0 6px ${G_GREEN}22, 0 0 0 12px ${G_GREEN}11`,
                                        }}
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
                                    >
                                        <CheckCircle2 className="w-8 h-8" style={{ color: G_GREEN }} />
                                    </motion.div>
                                </div>

                                {/* ── Confetti dots ── */}
                                <div className="flex gap-1.5 justify-center">
                                    {[G_BLUE, G_RED, G_YELLOW, G_GREEN].map((c, i) => (
                                        <motion.span
                                            key={i}
                                            className="block w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: c }}
                                            initial={{ scale: 0, y: 0 }}
                                            animate={{ scale: [0, 1.4, 1], y: [0, -8, 0] }}
                                            transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                                        />
                                    ))}
                                </div>

                                <div className="text-center space-y-1">
                                    <DialogTitle className="text-base font-semibold text-slate-800">
                                        Email Delivered!
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-400">
                                        Your message is on its way to the recipient's inbox.
                                    </DialogDescription>
                                </div>

                                {/* Completed step track */}
                                <div className="w-full">
                                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: G_GREEN }}
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full font-semibold text-white rounded-xl h-10 shadow-md hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: G_GREEN }}
                                    onClick={onClose}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Done
                                </Button>
                            </motion.div>
                        )}

                        {/* ════════ ERROR ════════ */}
                        {status === "error" && (
                            <motion.div
                                key="error"
                                className="flex flex-col items-center gap-5 w-full"
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                            >
                                {/* ── Glowing error ring ── */}
                                <div className="relative flex items-center justify-center">
                                    <motion.div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 88, height: 88,
                                            background: `radial-gradient(circle, ${G_RED}33 0%, transparent 70%)`,
                                        }}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                    <motion.div
                                        className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white"
                                        style={{
                                            border: `2px solid ${G_RED}`,
                                            boxShadow: `0 0 0 6px ${G_RED}22, 0 0 0 12px ${G_RED}11`,
                                        }}
                                        initial={{ scale: 0, rotate: 20 }}
                                        animate={{ scale: 1, rotate: [20, -8, 4, 0] }}
                                        transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
                                    >
                                        <XCircle className="w-8 h-8" style={{ color: G_RED }} />
                                    </motion.div>
                                </div>

                                <div className="text-center space-y-1">
                                    <DialogTitle className="text-base font-semibold text-slate-800">
                                        Failed to Send
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-400 break-words max-w-[280px]">
                                        {errorMessage || "Something went wrong. Please try again."}
                                    </DialogDescription>
                                </div>

                                {/* Error bar */}
                                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: G_RED }}
                                        initial={{ width: "0%" }}
                                        animate={{ width: "40%" }}
                                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                                    />
                                </div>

                                <Button
                                    className="w-full font-semibold text-white rounded-xl h-10 shadow-md hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: G_RED }}
                                    onClick={onClose}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Close
                                </Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Gmail Not Connected Banner ───────────────────────────────────────────────
interface GmailBannerProps {
    onConnect: () => void;
}

function GmailBanner({ onConnect }: GmailBannerProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-5 p-6 text-center">
            {/* Google G coloured dots */}
            <div className="relative w-16 h-16">
                <Mail className="w-16 h-16 text-slate-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-1">
                        {[G_BLUE, G_RED, G_YELLOW, G_GREEN].map((c, i) => (
                            <span key={i} className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">Verify your Gmail to continue</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                    Connect your Google account to send emails directly from your Gmail inbox.
                </p>
            </div>

            {/* Google‑style sign‑in button */}
            <button
                onClick={onConnect}
                className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                {/* Google SVG logo */}
                <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                    <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.4 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" />
                    <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.9 36.6 27.1 37 24 37c-5.8 0-10.7-3.9-12.5-9.3l-6.9 5.3C8.4 41.3 15.6 46 24 46z" />
                    <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.7 4.8-5 6.3l6.7 5.5C41.6 36.7 45 31 45 24c0-1.3-.2-2.7-.5-4z" />
                </svg>
                Sign in with Google
            </button>

            <p className="text-xs text-slate-400">
                We only request permission to <span className="font-medium text-slate-500">send emails</span> on your behalf.
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const MagicFillForm: React.FC = () => {
    const [magicText, setMagicText] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [googleToken, setGoogleToken] = useState<string | null>(null);
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
    const [sendError, setSendError] = useState<string>("");

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleToken(tokenResponse.access_token);
            try {
                const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (userInfo.data.email) {
                    setConnectedEmail(userInfo.data.email);
                    form.setValue("from", userInfo.data.email);
                }
            } catch (error) {
                console.error("Failed to fetch user info:", error);
            }
        },
        scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
    });

    const form = useForm<MailFormValues>({
        resolver: zodResolver(mailSchema),
        defaultValues: { from: "", to: "", subject: "", body: "" },
    });

    const handleMagicFill = async () => {
        if (!magicText.trim()) return;
        setIsParsing(true);
        try {
            const response = await MailService.parseMagicFill(magicText, connectedEmail);
            if (response.success && response.data) {
                const { from, to, subject, body } = response.data;
                if (from && !connectedEmail) form.setValue("from", from);
                form.setValue("to", to);
                form.setValue("subject", subject);
                form.setValue("body", body);
            }
        } catch (error) {
            console.error("Failed to parse text:", error);
        } finally {
            setIsParsing(false);
        }
    };

    const onSubmit = async (values: MailFormValues) => {
        setSendError("");
        setSendStatus("sending");
        setDialogOpen(true);
        try {
            const payload = {
                ...values,
                content: values.body,
                from: values.from,
                googleAccessToken: googleToken,
            };
            const response = await MailService.sendEmail(payload);
            if (response.success) {
                setSendStatus("success");
                form.reset();
                setMagicText("");
            } else {
                setSendStatus("error");
                setSendError(response.message || "Failed to send email.");
            }
        } catch (error: any) {
            console.error("Failed to send email:", error);
            const msg = error.response?.data?.message || "Failed to send email. Please check your connection.";
            setSendStatus("error");
            setSendError(msg);
        }
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setSendStatus("idle");
    };

    return (
        <>
            <SendDialog
                open={dialogOpen}
                status={sendStatus}
                errorMessage={sendError}
                onClose={closeDialog}
            />

            <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto p-4">

                {/* ── Left: Magic Fill Card ── */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Wand2 className="w-5 h-5" style={{ color: G_BLUE }} />
                            Magic Fill
                        </CardTitle>
                        <CardDescription>
                            Paste your rough thoughts — AI will draft a professional email.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder='e.g., "Ask Rahul at rahul@company.com for 3 days leave from next Monday."'
                            className="min-h-[200px] resize-none focus-visible:ring-2 text-sm"
                            style={{ "--tw-ring-color": G_BLUE } as React.CSSProperties}
                            value={magicText}
                            onChange={(e) => setMagicText(e.target.value)}
                        />

                        {/* Magic Fill Button — Google Blue */}
                        <Button
                            onClick={handleMagicFill}
                            className="w-full text-white font-medium"
                            style={{ backgroundColor: G_BLUE }}
                            disabled={isParsing || !magicText.trim()}
                        >
                            {isParsing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Drafting with AI…
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Magic Fill
                                </>
                            )}
                        </Button>

                        {/* Gmail Connect Section */}
                        <div className="pt-3 border-t">
                            {connectedEmail ? (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                                    <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: G_GREEN }} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-green-700">Gmail Connected</p>
                                        <p className="text-xs text-green-600 truncate">{connectedEmail}</p>
                                    </div>
                                    <button
                                        onClick={() => login()}
                                        className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline shrink-0"
                                    >
                                        Switch
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => login()}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    <svg width="18" height="18" viewBox="0 0 48 48">
                                        <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                                        <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.4 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" />
                                        <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.5-5.4l-6.7-5.5C29.9 36.6 27.1 37 24 37c-5.8 0-10.7-3.9-12.5-9.3l-6.9 5.3C8.4 41.3 15.6 46 24 46z" />
                                        <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.7 4.8-5 6.3l6.7 5.5C41.6 36.7 45 31 45 24c0-1.3-.2-2.7-.5-4z" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            )}
                            {!connectedEmail && (
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    Required to send emails from your Gmail account.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Right: Draft Email Card ── */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Mail className="w-5 h-5" style={{ color: G_RED }} />
                            Draft Email
                        </CardTitle>
                        <CardDescription>Review and send your email.</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* If Gmail not connected → show verification banner */}
                        {!connectedEmail ? (
                            <GmailBanner onConnect={() => login()} />
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    {/* From */}
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-1.5">
                                                    From
                                                    <span className="text-xs font-normal px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: G_GREEN }}>
                                                        Verified
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        readOnly
                                                        className="bg-slate-50 cursor-not-allowed text-slate-600 border-slate-200"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* To */}
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>To</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="recipient@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Subject */}
                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Subject</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Email Subject" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Body */}
                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Body</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Your email content will appear here after Magic Fill…"
                                                        className="min-h-[160px] resize-none text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Send Button — Google Blue */}
                                    <Button
                                        type="submit"
                                        className="w-full text-white font-medium"
                                        style={{ backgroundColor: G_BLUE }}
                                        disabled={sendStatus === "sending"}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Email
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
