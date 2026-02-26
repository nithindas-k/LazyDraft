import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

const G_YELLOW = "#FBBC05";

interface SubjectSuggestionsProps {
    suggestions: string[];
    loading: boolean;
    onSelect: (subject: string) => void;
    onFetch: () => void;
    disabled?: boolean;
}

export function SubjectSuggestions({ suggestions, loading, onSelect, onFetch, disabled }: SubjectSuggestionsProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id="suggest-subjects-btn"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFetch}
                    disabled={disabled || loading}
                    className="h-7 px-2 text-xs rounded-lg gap-1"
                    style={{ color: G_YELLOW }}
                >
                    {loading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" />}
                    AI Suggest
                </Button>
            </PopoverTrigger>
            {suggestions.length > 0 && (
                <PopoverContent className="w-80 p-3 rounded-xl shadow-lg border border-slate-100" align="start">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Click to use a suggestion:</p>
                    <div className="flex flex-col gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                id={`subject-suggestion-${i}`}
                                onClick={() => onSelect(s)}
                                className="text-left text-xs px-3 py-2 rounded-lg border border-slate-100 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-slate-700 hover:text-slate-900"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            )}
        </Popover>
    );
}
