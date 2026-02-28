import { useEffect, useMemo, useState } from "react";
import { MailService, type AutoReplyInboundItem } from "@/services/mail.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, XCircle, MailOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const statusColorMap: Record<string, string> = {
  DRAFTED: "bg-amber-50 text-amber-700 border-amber-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BLOCKED: "bg-rose-50 text-rose-700 border-rose-200",
  SKIPPED: "bg-slate-100 text-slate-700 border-slate-200",
};

const AutoReplyInboxPage: React.FC = () => {
  const [items, setItems] = useState<AutoReplyInboundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AutoReplyInboundItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await MailService.getAutoReplyInbound(60);
      if (res.success && Array.isArray(res.data)) {
        setItems(
          res.data.map((item: any) => ({
            ...item,
            id: item.id || item._id,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingManual = useMemo(
    () => items.filter((i) => i.autoReplyStatus === "DRAFTED"),
    [items]
  );

  const approve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await MailService.approveAutoReply(id);
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await MailService.rejectAutoReply(id, "Rejected from review inbox");
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Auto Reply Inbox</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review inbound mails, approve drafts, or block replies.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={load} disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-800">Pending Approval</CardTitle>
          <CardDescription>{pendingManual.length} inbound mail(s) waiting for manual approval.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inbox...
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">No inbound mails found yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.subject || "(No Subject)"}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">From: {item.from}</p>
                    </div>
                    <Badge className={`border ${statusColorMap[item.autoReplyStatus || "SKIPPED"] || statusColorMap.SKIPPED}`}>
                      {item.autoReplyStatus || "SKIPPED"}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 max-h-10 overflow-hidden">{item.content?.replace(/<[^>]+>/g, " ") || "-"}</p>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <button
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => setSelected(item)}
                    >
                      <MailOpen className="w-3.5 h-3.5 mr-1" />
                      Open details
                    </button>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject(item.id)}
                        disabled={actionLoadingId === item.id || item.autoReplyStatus !== "DRAFTED"}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approve(item.id)}
                        disabled={actionLoadingId === item.id || item.autoReplyStatus !== "DRAFTED"}
                        className="w-full sm:w-auto bg-[#4285F4] hover:opacity-90 text-white"
                      >
                        {actionLoadingId === item.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        )}
                        Approve & Send
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.subject || "(No Subject)"}</SheetTitle>
            <SheetDescription>From: {selected?.from}</SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          <div className="text-sm text-slate-700 leading-6 whitespace-pre-wrap">
            {selected?.content?.replace(/<[^>]+>/g, " ") || "No content"}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AutoReplyInboxPage;
