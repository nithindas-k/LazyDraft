import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailPreviewSheetProps {
    open: boolean;
    onClose: () => void;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
}

function buildEmailHtml(from: string, to: string, cc: string, bcc: string, subject: string, body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{font-family:'Google Sans',Roboto,Arial,sans-serif;background:#f1f3f4;margin:0;padding:24px;}
  .card{background:#fff;border-radius:12px;max-width:680px;margin:0 auto;box-shadow:0 1px 6px rgba(0,0,0,0.12);}
  .bar{display:flex;height:4px;border-radius:12px 12px 0 0;overflow:hidden;}
  .bar div{flex:1;}
  .header{padding:20px 24px 14px;border-bottom:1px solid #e8eaed;}
  .subject{font-size:18px;font-weight:600;color:#202124;margin:0 0 10px;}
  .meta{font-size:13px;color:#5f6368;line-height:1.7;}
  .meta span{color:#202124;font-weight:500;}
  .body{padding:20px 24px 28px;font-size:14px;color:#3c4043;line-height:1.7;}
</style></head><body>
<div class="card">
  <div class="bar">
    <div style="background:#4285F4"></div>
    <div style="background:#EA4335"></div>
    <div style="background:#FBBC05"></div>
    <div style="background:#34A853"></div>
  </div>
  <div class="header">
    <p class="subject">${subject || "(No subject)"}</p>
    <div class="meta">
      <div>From: <span>${from || "—"}</span></div>
      <div>To: <span>${to || "—"}</span></div>
      ${cc ? `<div>CC: <span>${cc}</span></div>` : ""}
      ${bcc ? `<div>BCC: <span>${bcc}</span></div>` : ""}
    </div>
  </div>
  <div class="body">${body || "<em style='color:#9aa0a6'>No body content yet.</em>"}</div>
</div>
</body></html>`;
}

export function EmailPreviewSheet({ open, onClose, from, to, cc = "", bcc = "", subject, body }: EmailPreviewSheetProps) {
    const html = buildEmailHtml(from, to, cc, bcc, subject, body);
    return (
        <Sheet open={open} onOpenChange={(o: boolean) => { if (!o) onClose(); }}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
                <SheetHeader className="px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <SheetTitle className="flex items-center justify-between gap-2 text-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="sm:hidden h-8 px-2 text-xs gap-1 rounded-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        Email Preview
                        </span>
                    </SheetTitle>
                </SheetHeader>
                <div className="p-4 bg-slate-50 min-h-[calc(100vh-64px)]">
                    <iframe
                        title="Email Preview"
                        srcDoc={html}
                        className="w-full rounded-xl border-0 shadow-sm"
                        style={{ minHeight: "420px", height: "calc(100vh - 120px)" }}
                        sandbox="allow-same-origin"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
