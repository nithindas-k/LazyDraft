import { useEffect, useRef } from "react";

const DRAFT_KEY = "lazydraft_draft";

export function useDraftSave(values: Record<string, any>, enabled: boolean) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
            } catch {
                
            }
        }, 2000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [JSON.stringify(values), enabled]);
}

export function loadDraft(): Record<string, any> | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // ignore
    }
}
