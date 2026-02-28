import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, CalendarClock, History, LineChart, Mail, ShieldCheck, Sparkles, Workflow, Inbox } from "lucide-react";

const services = [
  {
    title: "AI Magic Fill",
    description: "Convert rough text into a professional email draft with tone, language, and length controls.",
    icon: Sparkles,
    status: "Active",
  },
  {
    title: "Direct Gmail Sending",
    description: "Send emails directly from your connected Google account with delivery status tracking.",
    icon: Mail,
    status: "Active",
  },
  {
    title: "Recurring Campaigns",
    description: "Schedule recurring emails by weekday and time for teams, classes, clients, and reminders.",
    icon: Workflow,
    status: "Active",
  },
  {
    title: "Email History",
    description: "Review sent emails with replied and opened indicators in one place.",
    icon: History,
    status: "Active",
  },
  {
    title: "Templates",
    description: "Save reusable templates and quickly apply them in Mail Sender.",
    icon: Bot,
    status: "Active",
  },
  {
    title: "Analytics Dashboard",
    description: "Track send performance, response indicators, and time-based activity insights.",
    icon: LineChart,
    status: "Active",
  },
  {
    title: "Scheduled Send",
    description: "Set a future date and time for one-time email delivery.",
    icon: CalendarClock,
    status: "Active",
  },
  {
    title: "OAuth Security",
    description: "Google OAuth based authentication and protected routes for account-level access.",
    icon: ShieldCheck,
    status: "Active",
  },
  {
    title: "Auto Reply Inbox",
    description: "Scan inbound Gmail messages and generate safe manual or automatic thread replies directly from your inbox.",
    icon: Inbox,
    status: "Active",
  },
];

const ServicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Services</h1>
        <p className="mt-1 text-slate-500">
          Everything currently available in your LazyDraft workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.title} className="border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200">
                    {service.status}
                  </Badge>
                </div>
                <CardTitle className="pt-2 text-base text-slate-800">{service.title}</CardTitle>
                <CardDescription className="text-slate-500">{service.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesPage;
