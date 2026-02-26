import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Wand2, Send, Loader2, ShieldCheck, Mail,
    CheckCircle2, Zap, RefreshCw, BookOpen, Sparkles, FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MailService } from "../../services/mail.service";

// ── Google brand colours ──────────────────────────────────────────────────────
const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";
const G_COLORS = [G_BLUE, G_RED, G_YELLOW, G_GREEN];

// ── Schema ────────────────────────────────────────────────────────────────────
const mailSchema = z.object({
    from: z.string().email("Invalid sender email"),
    to: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
});
type MailFormValues = z.infer<typeof mailSchema>;
type SendStatus = "idle" | "sending" | "success" | "error";

// ── Pipeline steps ────────────────────────────────────────────────────────────
const STEPS = [
    { label: "Authenticating", sub: "Verifying your Gmail token", icon: ShieldCheck, color: G_BLUE },
    { label: "Composing", sub: "Packaging your message", icon: Mail, color: G_YELLOW },
    { label: "Delivering", sub: "Handing off to Gmail servers", icon: Send, color: G_GREEN },
];

// ── Particle burst (confetti on success) ──────────────────────────────────────
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 2 * Math.PI;
    const dist = 60 + Math.random() * 40;
    return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: G_COLORS[i % 4],
        size: 4 + Math.random() * 5,
    };
});

function ParticleBurst() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {PARTICLES.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.7 + Math.random() * 0.4, delay: 0.05 * i, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

// ── Animated SVG checkmark ────────────────────────────────────────────────────
function AnimatedCheck({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 52 52" fill="none" className="w-10 h-10">
            <motion.circle
                cx="26" cy="26" r="25"
                stroke={color} strokeWidth="2" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.path
                d="M14 27l8 8 16-16"
                stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            />
        </svg>
    );
}

// ── Animated SVG X mark ───────────────────────────────────────────────────────
function AnimatedX({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 52 52" fill="none" className="w-10 h-10">
            <motion.circle
                cx="26" cy="26" r="25"
                stroke={color} strokeWidth="2" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.path
                d="M16 16l20 20M36 16L16 36"
                stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
            />
        </svg>
    );
}

// ── Orbital ring ──────────────────────────────────────────────────────────────
function OrbitalRing({
    size, duration, color, delay = 0, reverse = false,
}: {
    size: number; duration: number; color: string; delay?: number; reverse?: boolean;
}) {
    return (
        <motion.div
            className="absolute rounded-full border-2"
            style={{
                width: size, height: size,
                borderColor: `${color}50`,
                borderTopColor: color,
                borderRightColor: `${color}20`,
            }}
            animate={{ rotate: reverse ? [0, -360] : [0, 360] }}
            transition={{ duration, repeat: Infinity, ease: "linear", delay }}
        />
    );
}

// ── Shimmer progress bar ──────────────────────────────────────────────────────
function ShimmerBar({ progress, color }: { progress: number; color: string }) {
    return (
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative">
            <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {/* Shimmer gleam */}
            <motion.div
                className="absolute inset-y-0 w-20 rounded-full"
                style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                }}
                animate={{ x: ["-80px", "500px"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear", repeatDelay: 0.3 }}
            />
        </div>
    );
}

// ── AI pipeline steps ─────────────────────────────────────────────────────────
const AI_STEPS = [
    { label: "Reading", sub: "Understanding your intent", icon: BookOpen, color: G_BLUE },
    { label: "Thinking", sub: "AI is crafting the structure", icon: Sparkles, color: G_YELLOW },
    { label: "Drafting", sub: "Writing your professional email", icon: FileText, color: G_GREEN },
];

// ── Parse (AI) Dialog ─────────────────────────────────────────────────────────
function ParseDialog({ open }: { open: boolean }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(8);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!open) {
            if (timerRef.current) clearInterval(timerRef.current);
            setStepIndex(0);
            setProgress(8);
            return;
        }
        let step = 0;
        setStepIndex(0);
        setProgress(8);
        timerRef.current = setInterval(() => {
            step = (step + 1) % AI_STEPS.length;
            setStepIndex(step);
            setProgress(Math.round(((step + 1) / AI_STEPS.length) * 88));
        }, 1600);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [open]);

    return (
        <Dialog open={open}>
            <DialogContent
                className="max-w-[320px] sm:max-w-[400px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-0 shadow-2xl bg-white [&>button]:hidden"
            >
                {/* Google colour bar — cycles with AI step colour */}
                <div className="flex h-1">
                    {G_COLORS.map((c, i) => (
                        <motion.div
                            key={i}
                            className="flex-1"
                            animate={{ backgroundColor: AI_STEPS[stepIndex]?.color ?? c }}
                            transition={{ duration: 0.8 }}
                        />
                    ))}
                </div>

                <div className="px-5 py-6 sm:px-8 sm:py-8 flex flex-col items-center gap-5 sm:gap-6">

                    {/* ── Orbital animation (AI themed) ── */}
                    <div className="scale-[0.78] sm:scale-100 origin-center">
                        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                            {/* Outer slow ring */}
                            <OrbitalRing size={120} duration={4} color={G_BLUE} />
                            <OrbitalRing size={94} duration={2.8} color={G_YELLOW} reverse delay={0.4} />
                            <OrbitalRing size={68} duration={1.8} color={G_GREEN} delay={0.8} />

                            {/* Pulsing centre glow */}
                            <motion.div
                                className="absolute rounded-full"
                                style={{ width: 52, height: 52, background: `radial-gradient(circle, ${AI_STEPS[stepIndex]?.color ?? G_BLUE}30 0%, transparent 70%)` }}
                                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Centre icon */}
                            <motion.div
                                className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg"
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <AnimatePresence mode="wait">
                                    {AI_STEPS.map((step, i) => i === stepIndex ? (
                                        <motion.div
                                            key={step.label}
                                            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.4, rotate: 20 }}
                                            transition={{ duration: 0.3, ease: "backOut" }}
                                        >
                                            <step.icon className="w-7 h-7" style={{ color: step.color }} />
                                        </motion.div>
                                    ) : null)}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </div>

                    {/* ── Heading + animated step label ── */}
                    <div className="text-center space-y-1">
                        <DialogTitle className="text-sm sm:text-base font-bold text-slate-800">
                            ✨ AI is generating your email…
                        </DialogTitle>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={stepIndex}
                                className="flex flex-col items-center gap-0.5"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                            >
                                <p className="text-xs font-bold tracking-widest uppercase"
                                    style={{ color: AI_STEPS[stepIndex]?.color ?? G_BLUE }}>
                                    {AI_STEPS[stepIndex]?.label}
                                </p>
                                <p className="text-xs text-slate-400">{AI_STEPS[stepIndex]?.sub}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Shimmer bar + step pipeline ── */}
                    <div className="w-full space-y-3">
                        <ShimmerBar progress={progress} color={AI_STEPS[stepIndex]?.color ?? G_BLUE} />

                        <div className="flex items-center justify-between">
                            {AI_STEPS.map((step, i) => {
                                const done = i < stepIndex;
                                const current = i === stepIndex;
                                return (
                                    <React.Fragment key={step.label}>
                                        <div className="flex flex-col items-center gap-1">
                                            <motion.div
                                                className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center border-2"
                                                animate={{
                                                    backgroundColor: done ? step.color : current ? `${step.color}20` : "#f1f5f9",
                                                    borderColor: done || current ? step.color : "#e2e8f0",
                                                    scale: current ? 1.15 : 1,
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {done ? (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 14 }}>
                                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                ) : (
                                                    <step.icon className="w-3 h-3"
                                                        style={{ color: current ? step.color : "#94a3b8" }} />
                                                )}
                                            </motion.div>
                                            <span className="text-[9px] font-semibold tracking-wide uppercase"
                                                style={{ color: done || current ? step.color : "#94a3b8" }}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < AI_STEPS.length - 1 && (
                                            <motion.div className="flex-1 h-0.5 mx-1 rounded-full"
                                                animate={{ backgroundColor: done ? AI_STEPS[i].color : "#e2e8f0" }}
                                                transition={{ duration: 0.4 }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Google bouncing dots ── */}
                    <div className="flex gap-2">
                        {G_COLORS.map((c, i) => (
                            <motion.span key={i} className="block w-2 h-2 rounded-full"
                                style={{ backgroundColor: c }}
                                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.13 }} />
                        ))}
                    </div>

                    <DialogDescription className="text-[11px] text-slate-400 text-center">
                        This usually takes a few seconds. Please wait…
                    </DialogDescription>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Send Dialog ───────────────────────────────────────────────────────────────
interface SendDialogProps {
    open: boolean;
    status: SendStatus;
    errorMessage?: string;
    onClose: () => void;
}

function SendDialog({ open, status, errorMessage, onClose }: SendDialogProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [showBurst, setShowBurst] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Drive step + progress while sending
    useEffect(() => {
        if (status !== "sending") {
            if (timerRef.current) clearInterval(timerRef.current);
            if (status === "success") {
                setProgress(100);
                setShowBurst(true);
                setTimeout(() => setShowBurst(false), 900);
            }
            return;
        }
        setStepIndex(0);
        setProgress(5);
        let step = 0;
        timerRef.current = setInterval(() => {
            step = (step + 1) % STEPS.length;
            setStepIndex(step);
            setProgress(Math.round(((step + 1) / STEPS.length) * 85));
        }, 1400);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status]);

    const isSending = status === "sending";
    const isSuccess = status === "success";
    const isError = status === "error";


    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o && !isSending) onClose(); }}>
            <DialogContent className="max-w-[320px] sm:max-w-[420px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-0 shadow-2xl bg-white">

                {/* ── Google colour bar ── */}
                <div className="flex h-1">
                    {G_COLORS.map((c) => (
                        <motion.div
                            key={c}
                            className="flex-1"
                            animate={{ backgroundColor: isSuccess ? G_GREEN : isError ? G_RED : c }}
                            transition={{ duration: 0.6 }}
                        />
                    ))}
                </div>

                <div className="px-5 py-5 sm:px-8 sm:py-8 flex flex-col items-center gap-4 sm:gap-7">
                    <AnimatePresence mode="wait">

                        {/* ══════════════ SENDING ══════════════ */}
                        {isSending && (
                            <motion.div
                                key="sending"
                                className="flex flex-col items-center gap-4 sm:gap-6 w-full"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Orbital rings — scale down on mobile, full size on desktop */}
                                <div className="scale-[0.72] sm:scale-100 origin-center">
                                    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                                        <OrbitalRing size={120} duration={3} color={G_BLUE} />
                                        <OrbitalRing size={94} duration={2.1} color={G_RED} reverse delay={0.3} />
                                        <OrbitalRing size={68} duration={1.5} color={G_YELLOW} delay={0.6} />

                                        {/* Centre icon */}
                                        <motion.div
                                            className="absolute flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg"
                                            animate={{ scale: [1, 1.07, 1] }}
                                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {STEPS.map((step, i) =>
                                                    i === stepIndex ? (
                                                        <motion.div
                                                            key={step.label}
                                                            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                            exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                                                            transition={{ duration: 0.35, ease: "backOut" }}
                                                        >
                                                            <step.icon className="w-7 h-7" style={{ color: step.color }} />
                                                        </motion.div>
                                                    ) : null
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Title + animated step label */}
                                <div className="text-center space-y-1 sm:space-y-1.5">
                                    <DialogTitle className="text-sm sm:text-base font-bold text-slate-800">
                                        Sending your email…
                                    </DialogTitle>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={stepIndex}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-0.5"
                                        >
                                            <p className="text-xs font-bold tracking-widest uppercase"
                                                style={{ color: STEPS[stepIndex]?.color ?? G_BLUE }}>
                                                {STEPS[stepIndex]?.label}
                                            </p>
                                            <p className="text-xs text-slate-400">{STEPS[stepIndex]?.sub}</p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Shimmer progress bar */}
                                <div className="w-full space-y-3">
                                    <ShimmerBar progress={progress} color={STEPS[stepIndex]?.color ?? G_BLUE} />

                                    {/* Step pipeline */}
                                    <div className="flex items-center justify-between">
                                        {STEPS.map((step, i) => {
                                            const done = i < stepIndex;
                                            const current = i === stepIndex;
                                            return (
                                                <React.Fragment key={step.label}>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <motion.div
                                                            className="w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center border-2"
                                                            animate={{
                                                                backgroundColor: done ? step.color : current ? `${step.color}20` : "#f1f5f9",
                                                                borderColor: done || current ? step.color : "#e2e8f0",
                                                                scale: current ? 1.15 : 1,
                                                            }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            {done ? (
                                                                <motion.div
                                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                    transition={{ type: "spring", stiffness: 400, damping: 14 }}
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                                </motion.div>
                                                            ) : (
                                                                <step.icon
                                                                    className="w-3.5 h-3.5"
                                                                    style={{ color: current ? step.color : "#94a3b8" }}
                                                                />
                                                            )}
                                                        </motion.div>
                                                        <span className="text-[9px] font-semibold tracking-wide uppercase"
                                                            style={{ color: done || current ? step.color : "#94a3b8" }}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                    {i < STEPS.length - 1 && (
                                                        <motion.div
                                                            className="flex-1 h-0.5 mx-1 rounded-full"
                                                            animate={{ backgroundColor: done ? STEPS[i].color : "#e2e8f0" }}
                                                            transition={{ duration: 0.4 }}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Google bouncing dots */}
                                <div className="flex gap-2">
                                    {G_COLORS.map((c, i) => (
                                        <motion.span
                                            key={i}
                                            className="block w-2 h-2 rounded-full"
                                            style={{ backgroundColor: c }}
                                            animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut", delay: i * 0.13 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ══════════════ SUCCESS ══════════════ */}
                        {isSuccess && (
                            <motion.div
                                key="success"
                                className="flex flex-col items-center gap-4 sm:gap-6 w-full"
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.88 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            >
                                {/* Icon + particle burst */}
                                {/* Scale down on mobile */}
                                <div className="scale-[0.72] sm:scale-100 origin-center">
                                    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                                        {showBurst && <ParticleBurst />}

                                        {/* Glow ring */}
                                        <motion.div
                                            className="absolute rounded-full"
                                            style={{ width: 110, height: 110, background: `radial-gradient(circle, ${G_GREEN}30 0%, transparent 70%)` }}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1.1, opacity: 1 }}
                                            transition={{ duration: 0.6 }}
                                        />

                                        {/* Pulse rings */}
                                        {[1, 2].map((k) => (
                                            <motion.div
                                                key={k}
                                                className="absolute rounded-full border-2"
                                                style={{ borderColor: `${G_GREEN}40`, width: 80, height: 80 }}
                                                animate={{ scale: [1, 1.6 + k * 0.2], opacity: [0.6, 0] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: k * 0.4, ease: "easeOut" }}
                                            />
                                        ))}

                                        {/* Central white circle */}
                                        <motion.div
                                            className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-xl"
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                                        >
                                            <AnimatedCheck color={G_GREEN} />
                                        </motion.div>
                                    </div>
                                </div>{/* end scale wrapper */}

                                {/* Text */}
                                <div className="text-center space-y-1">
                                    <DialogTitle className="text-base sm:text-xl font-bold text-slate-800">
                                         Email Delivered!
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm text-slate-500">
                                        Your message is on its way to the recipient's inbox.
                                    </DialogDescription>
                                </div>

                                {/* Full green bar */}
                                <div className="w-full space-y-1">
                                    <ShimmerBar progress={100} color={G_GREEN} />
                                    <div className="flex justify-between">
                                        {STEPS.map((step) => (
                                            <motion.span
                                                key={step.label}
                                                className="text-[9px] font-bold tracking-wide uppercase"
                                                style={{ color: G_GREEN }}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                {step.label} ✓
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-9 sm:h-11 font-bold text-white rounded-xl sm:rounded-2xl shadow-md text-sm"
                                    style={{ backgroundColor: G_GREEN }}
                                    onClick={onClose}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Done
                                </Button>
                            </motion.div>
                        )}

                        {/* ══════════════ ERROR ══════════════ */}
                        {isError && (
                            <motion.div
                                key="error"
                                className="flex flex-col items-center gap-4 sm:gap-6 w-full"
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.88 }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            >
                                {/* Icon */}
                                {/* Scale down on mobile */}
                                <div className="scale-[0.72] sm:scale-100 origin-center">
                                    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                                        <motion.div
                                            className="absolute rounded-full"
                                            style={{ width: 110, height: 110, background: `radial-gradient(circle, ${G_RED}25 0%, transparent 70%)` }}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1.05, opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                        <motion.div
                                            className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-xl"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: [0, -8, 8, -5, 5, 0] }}
                                            transition={{ type: "spring", stiffness: 350, damping: 12, delay: 0.1 }}
                                        >
                                            <AnimatedX color={G_RED} />
                                        </motion.div>
                                    </div>
                                </div>{/* end scale wrapper */}

                                {/* Text */}
                                <div className="text-center space-y-1 w-full">
                                    <DialogTitle className="text-base font-bold text-slate-800">
                                        Failed to Send
                                    </DialogTitle>
                                    <DialogDescription
                                        className="text-xs text-slate-600 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed break-words"
                                    >
                                        {errorMessage || "Something went wrong. Please try again."}
                                    </DialogDescription>
                                </div>

                                {/* Partial red bar */}
                                <div className="w-full">
                                    <ShimmerBar progress={35} color={G_RED} />
                                </div>

                                <Button
                                    className="w-full h-9 sm:h-11 font-bold text-white rounded-xl sm:rounded-2xl shadow-md text-sm"
                                    style={{ backgroundColor: G_RED }}
                                    onClick={onClose}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}


// ── Main Form Component ───────────────────────────────────────────────────────
export const MagicFillForm: React.FC = () => {
    const { user } = useAuth();
    const [magicText, setMagicText] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [parseDialogOpen, setParseDialogOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
    const [sendError, setSendError] = useState("");

    const connectedEmail = user?.email || "";

    const form = useForm<MailFormValues>({
        resolver: zodResolver(mailSchema),
        defaultValues: { from: connectedEmail, to: "", subject: "", body: "" },
    });

    const handleMagicFill = async () => {
        if (!magicText.trim()) return;
        setIsParsing(true);
        setParseDialogOpen(true);
        try {
            const response = await MailService.parseMagicFill(magicText, connectedEmail);
            if (response.success && response.data) {
                const { to, subject, body } = response.data;
                if (connectedEmail) form.setValue("from", connectedEmail);
                form.setValue("to", to);
                form.setValue("subject", subject);
                form.setValue("body", body);
            }
        } catch (error) {
            console.error("Failed to parse text:", error);
        } finally {
            setIsParsing(false);
            setParseDialogOpen(false);
        }
    };

    const onSubmit = async (values: MailFormValues) => {
        setSendError("");
        setSendStatus("sending");
        setDialogOpen(true);
        try {
            const response = await MailService.sendEmail({
                ...values,
                content: values.body,
                from: values.from,
            });
            if (response.success) {
                setSendStatus("success");
                form.reset({ from: connectedEmail, to: "", subject: "", body: "" });
                setMagicText("");
            } else {
                setSendStatus("error");
                setSendError((response as any).message || "Failed to send email.");
            }
        } catch (error: any) {
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
            <ParseDialog open={parseDialogOpen} />
            <SendDialog
                open={dialogOpen}
                status={sendStatus}
                errorMessage={sendError}
                onClose={closeDialog}
            />

            <div className="grid gap-6 lg:grid-cols-2 max-w-6xl mx-auto px-2 sm:px-4 pb-10">

                {/* ── Magic Fill Card ── */}
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
                        <Button
                            onClick={handleMagicFill}
                            className="w-full text-white font-medium"
                            style={{ backgroundColor: G_BLUE }}
                            disabled={isParsing || !magicText.trim()}
                        >
                            {isParsing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Drafting with AI…</>
                            ) : (
                                <><Wand2 className="mr-2 h-4 w-4" />Magic Fill</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* ── Draft Email Card ── */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Mail className="w-5 h-5" style={{ color: G_RED }} />
                            Draft Email
                        </CardTitle>
                        <CardDescription>Review and send your email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                {/* From */}
                                <FormField control={form.control} name="from" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            From
                                            <span className="text-xs font-normal px-1.5 py-0.5 rounded-full text-white"
                                                style={{ backgroundColor: G_GREEN }}>
                                                Verified
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} readOnly
                                                className="bg-slate-50 cursor-not-allowed text-slate-600 border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* To */}
                                <FormField control={form.control} name="to" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To</FormLabel>
                                        <FormControl>
                                            <Input placeholder="recipient@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Subject */}
                                <FormField control={form.control} name="subject" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Email Subject" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Body */}
                                <FormField control={form.control} name="body" render={({ field }) => (
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
                                )} />

                                {/* Send */}
                                <motion.div whileTap={{ scale: 0.97 }}>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-white font-semibold rounded-xl shadow-md"
                                        style={{ backgroundColor: G_BLUE }}
                                        disabled={sendStatus === "sending"}
                                    >
                                        {sendStatus === "sending" ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                                        ) : (
                                            <><Zap className="mr-2 h-4 w-4" />Send Email</>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
