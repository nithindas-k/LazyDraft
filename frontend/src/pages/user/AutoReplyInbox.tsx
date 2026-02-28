import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { MailService, type AutoReplyInboundItem, type AutoReplyMailDetails } from "@/services/mail.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MailOpen,
  Settings,
  X,
  User,
  Mail,
  Calendar,
  AlertTriangle,
} from "lucide-react";

const G_BLUE = "#4285F4";
const G_RED = "#EA4335";
const G_YELLOW = "#FBBC05";
const G_GREEN = "#34A853";

const inboundStatusColorMap: Record<string, string> = {
  DRAFTED: "bg-amber-50 text-amber-700 border-amber-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BLOCKED: "bg-rose-50 text-rose-700 border-rose-200",
  SKIPPED: "bg-slate-100 text-slate-700 border-slate-200",
};

const intentColorMap: Record<string, string> = {
  Complaint: "bg-rose-50 text-rose-700 border-rose-200",
  Inquiry: "bg-blue-50 text-blue-700 border-blue-200",
  "Follow-up": "bg-violet-50 text-violet-700 border-violet-200",
  "Spam-like": "bg-orange-50 text-orange-700 border-orange-200",
};

const outboundStatusColorMap: Record<string, string> = {
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
};

const toPlainText = (html?: string): string => {
  if (!html) return "-";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("style,script,noscript").forEach((node) => node.remove());
    const text = doc.body.textContent || "";
    return text.replace(/\s+/g, " ").trim() || "-";
  } catch {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "-";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
};

type AutoReplySettings = {
  autoReplyEnabled: boolean;
  autoReplyMode: "manual" | "auto";
  autoReplySignature: string;
  autoReplyCooldownMinutes: number;
};

function MailDetailsModal({
  open,
  onClose,
  fallbackInbound,
  details,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  fallbackInbound: AutoReplyInboundItem | null;
  details: AutoReplyMailDetails | null;
  loading: boolean;
}) {
  if (!open) return null;

  const inbound = details?.inbound || fallbackInbound;
  const autoReply = details?.autoReply || null;
  const inboundSubject = inbound?.subject || "(No Subject)";
  const inboundFrom = inbound?.from || "-";
  const inboundTo = (details?.inbound as any)?.to || "-";
  const inboundStatus = inbound?.autoReplyStatus || "SKIPPED";
  const intentTag = (inbound as any)?.intentTag;
  const intentConfidence = Number((inbound as any)?.intentConfidence);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full bg-white shadow-2xl flex flex-col rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[88vh] sm:max-w-4xl"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          <div className="flex h-1 shrink-0">
            {[G_BLUE, G_RED, G_YELLOW, G_GREEN].map((c) => (
              <div key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 shrink-0 border-b border-slate-100">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                style={{ backgroundColor: G_BLUE }}
              >
                {inboundFrom.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-slate-800 leading-snug line-clamp-2">{inboundSubject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Incoming mail details and auto-reply preview</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {intentTag ? (
                <span className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${intentColorMap[intentTag] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                  {intentTag}
                  {Number.isFinite(intentConfidence) ? ` ${Math.round(intentConfidence * 100)}%` : ""}
                </span>
              ) : null}
              <span className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${inboundStatusColorMap[inboundStatus] || inboundStatusColorMap.SKIPPED}`}>
                {inboundStatus}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-5 space-y-4 bg-slate-50">
            {loading ? (
              <div className="py-16 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading mail details...
              </div>
            ) : (
              <>
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-800">Incoming Mail</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${G_BLUE}18` }}>
                          <User className="w-3.5 h-3.5" style={{ color: G_BLUE }} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">From</p>
                          <p className="text-sm text-slate-700 break-all">{inboundFrom}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${G_RED}18` }}>
                          <Mail className="w-3.5 h-3.5" style={{ color: G_RED }} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">To</p>
                          <p className="text-sm text-slate-700 break-all">{inboundTo}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${G_GREEN}18` }}>
                          <Calendar className="w-3.5 h-3.5" style={{ color: G_GREEN }} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Received</p>
                          <p className="text-sm text-slate-700">{formatDate(inbound?.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    {intentTag ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${intentColorMap[intentTag] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          Intent: {intentTag}
                        </span>
                        {Number.isFinite(intentConfidence) ? (
                          <span className="text-xs text-slate-500">Confidence: {Math.round(intentConfidence * 100)}%</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Message</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{toPlainText(inbound?.content)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-slate-800">Auto Reply Preview / Sent Mail</CardTitle>
                    <CardDescription>
                      Shows generated draft in manual mode, or actual sent reply in auto mode.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {autoReply ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-slate-700 truncate">{autoReply.subject || "(No Subject)"}</div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${outboundStatusColorMap[autoReply.status] || outboundStatusColorMap.PENDING}`}>
                            {autoReply.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="text-xs text-slate-500"><span className="font-semibold text-slate-600">From:</span> {autoReply.from || "-"}</div>
                          <div className="text-xs text-slate-500"><span className="font-semibold text-slate-600">To:</span> {autoReply.to || "-"}</div>
                          <div className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Created:</span> {formatDate(autoReply.createdAt)}</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Auto Reply Body</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{toPlainText(autoReply.content)}</p>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                        No auto-reply draft has been generated yet for this mail.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="px-5 py-4 flex items-center justify-end gap-2 shrink-0 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{ backgroundColor: G_BLUE }}
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const AutoReplyInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AutoReplyInboundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AutoReplyInboundItem | null>(null);
  const [details, setDetails] = useState<AutoReplyMailDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [settings, setSettings] = useState<AutoReplySettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "PENDING" | "PROCESSED">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFTED" | "SENT" | "BLOCKED" | "SKIPPED">("ALL");
  const [intentFilter, setIntentFilter] = useState<"ALL" | "Complaint" | "Inquiry" | "Follow-up" | "Spam-like">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadSettings = async () => {
    try {
      const res = await MailService.getAutoReplySettings();
      if (res.success) setSettings(res.data);
    } catch {
      setSettings(null);
    }
  };

  const loadInbox = async () => {
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
    const bootstrap = async () => {
      await loadSettings();
      await loadInbox();
    };
    bootstrap();
  }, []);

  const pendingManual = useMemo(() => items.filter((i) => i.autoReplyStatus === "DRAFTED"), [items]);
  const processedItems = useMemo(() => items.filter((i) => i.autoReplyStatus !== "DRAFTED"), [items]);
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const plain = toPlainText(item.content).toLowerCase();
      const text = `${item.from} ${item.subject} ${plain}`.toLowerCase();
      const searchOk = !query || text.includes(query);

      const statusOk = statusFilter === "ALL" || (item.autoReplyStatus || "SKIPPED") === statusFilter;
      const intentOk = intentFilter === "ALL" || item.intentTag === intentFilter;

      const created = new Date(item.createdAt).getTime();
      const fromOk = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`).getTime();
      const toOk = !dateTo || created <= new Date(`${dateTo}T23:59:59`).getTime();

      const sectionOk =
        sectionFilter === "ALL" ||
        (sectionFilter === "PENDING" && item.autoReplyStatus === "DRAFTED") ||
        (sectionFilter === "PROCESSED" && item.autoReplyStatus !== "DRAFTED");

      return searchOk && statusOk && intentOk && fromOk && toOk && sectionOk;
    });
  }, [items, searchQuery, statusFilter, intentFilter, dateFrom, dateTo, sectionFilter]);
  const filteredPending = filteredItems.filter((i) => i.autoReplyStatus === "DRAFTED");
  const filteredProcessed = filteredItems.filter((i) => i.autoReplyStatus !== "DRAFTED");

  const clearFilters = () => {
    setSearchQuery("");
    setSectionFilter("ALL");
    setStatusFilter("ALL");
    setIntentFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const openDetails = async (item: AutoReplyInboundItem) => {
    setSelected(item);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const res = await MailService.getAutoReplyDetails(item.id);
      if (res.success) {
        setDetails(res.data);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelected(null);
    setDetails(null);
    setDetailsLoading(false);
  };

  const approve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await MailService.approveAutoReply(id);
      await loadInbox();
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await MailService.rejectAutoReply(id, "Rejected from review inbox");
      await loadInbox();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <MailDetailsModal open={!!selected} onClose={closeDetails} fallbackInbound={selected} details={details} loading={detailsLoading} />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Auto Reply Inbox</h1>
            <p className="text-slate-500 text-sm mt-1">Review incoming mails, check preview/sent auto-replies, and approve pending drafts.</p>
          </div>
          <Button type="button" variant="outline" onClick={loadInbox} disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by sender, subject, content..."
                className="xl:col-span-2"
              />
              <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v as "ALL" | "PENDING" | "PROCESSED")}>
                <SelectTrigger>
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sections</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | "DRAFTED" | "SENT" | "BLOCKED" | "SKIPPED")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFTED">Drafted</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="SKIPPED">Skipped</SelectItem>
                </SelectContent>
              </Select>
              <Select value={intentFilter} onValueChange={(v) => setIntentFilter(v as "ALL" | "Complaint" | "Inquiry" | "Follow-up" | "Spam-like")}>
                <SelectTrigger>
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Intents</SelectItem>
                  <SelectItem value="Complaint">Complaint</SelectItem>
                  <SelectItem value="Inquiry">Inquiry</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Spam-like">Spam-like</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {settings && !settings.autoReplyEnabled ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">Auto Reply is currently OFF</CardTitle>
              <CardDescription className="text-amber-800">
                To see and process mails here, please enable Auto Reply in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => navigate(APP_ROUTES.USER.SETTINGS)} className="bg-[#4285F4] hover:opacity-90 text-white w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {settings && !settings.autoReplyEnabled ? null : (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Pending Approval</CardTitle>
              <CardDescription>{filteredPending.length} inbound mail(s) waiting for manual approval.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="py-8 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inbox...
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No pending approvals right now.</div>
              ) : (
                <div className="space-y-3">
                  {filteredPending.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.subject || "(No Subject)"}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">From: {item.from}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.intentTag ? (
                          <Badge className={`border ${intentColorMap[item.intentTag] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {item.intentTag}
                          </Badge>
                        ) : null}
                        <Badge className={`border ${inboundStatusColorMap[item.autoReplyStatus || "SKIPPED"] || inboundStatusColorMap.SKIPPED}`}>
                          {item.autoReplyStatus || "SKIPPED"}
                        </Badge>
                      </div>
                    </div>

                      <p className="text-sm text-slate-600 max-h-10 overflow-hidden">{toPlainText(item.content)}</p>

                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <button className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700" onClick={() => openDetails(item)}>
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
                            {actionLoadingId === item.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
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
        )}

        {settings && !settings.autoReplyEnabled ? null : (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Processed</CardTitle>
              <CardDescription>{filteredProcessed.length} item(s) handled by safety rules or auto-send.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="py-6 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading processed mails...
                </div>
              ) : filteredProcessed.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">No processed items yet.</div>
              ) : (
                <div className="space-y-3">
                  {filteredProcessed.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.subject || "(No Subject)"}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">From: {item.from}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.intentTag ? (
                          <Badge className={`border ${intentColorMap[item.intentTag] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                            {item.intentTag}
                          </Badge>
                        ) : null}
                        <Badge className={`border ${inboundStatusColorMap[item.autoReplyStatus || "SKIPPED"] || inboundStatusColorMap.SKIPPED}`}>
                          {item.autoReplyStatus || "SKIPPED"}
                        </Badge>
                      </div>
                    </div>
                      <p className="text-sm text-slate-600 max-h-10 overflow-hidden">{toPlainText(item.content)}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xs text-slate-500">{item.autoReplyReason || "No extra reason available."}</div>
                        <button className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700" onClick={() => openDetails(item)}>
                          <MailOpen className="w-3.5 h-3.5 mr-1" />
                          Open details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AutoReplyInboxPage;
