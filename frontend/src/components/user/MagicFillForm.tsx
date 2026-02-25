import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wand2, Send, Loader2, CheckCircle2, XCircle, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


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

// ─── Main Component ───────────────────────────────────────────────────────────
export const MagicFillForm: React.FC = () => {
    const { user } = useAuth();
    const [magicText, setMagicText] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
    const [sendError, setSendError] = useState<string>("");

    const connectedEmail = user?.email || "";

    const form = useForm<MailFormValues>({
        resolver: zodResolver(mailSchema),
        defaultValues: { from: connectedEmail, to: "", subject: "", body: "" },
    });

    const handleMagicFill = async () => {
        if (!magicText.trim()) return;
        setIsParsing(true);
        try {
            const response = await MailService.parseMagicFill(magicText, connectedEmail);
            if (response.success && response.data) {
                const { from, to, subject, body } = response.data;
                if (from && connectedEmail) form.setValue("from", connectedEmail);
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

                        {/* Gmail Connect Section Removed (Handled by Global Auth) */}
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
                        {/* Always show the exact form, Gmail is globally connected */}
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
