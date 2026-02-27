import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_ROUTES } from "@/constants/routes";

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100/70">
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border border-slate-200 bg-white text-slate-700 hover:bg-white">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Privacy
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to={APP_ROUTES.HOME}>Back to App</Link>
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 sm:text-3xl">Privacy Policy</CardTitle>
            <CardDescription>Last updated: February 27, 2026</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-5 pt-6 text-sm leading-6 text-slate-700">
            <p>
              LazyDraft helps users draft and send emails from their own Google account. We only request access required to provide core features such as email drafting, sending, history, and analytics.
            </p>

            <section>
              <h2 className="font-semibold text-slate-900">Data We Access</h2>
              <p className="mt-1">We may access profile details (name, email) and limited Gmail scopes needed for sending emails and reading metadata required for app features.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">How We Use Data</h2>
              <p className="mt-1">Data is used only to operate LazyDraft features, improve reliability, and provide user-visible analytics within your account experience.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Data Sharing</h2>
              <p className="mt-1">We do not sell personal data. We do not share user email content with third parties except when required to provide integrated services selected by the user.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Security</h2>
              <p className="mt-1">We use industry-standard controls to protect access tokens and account data. Access is restricted and monitored for operational safety.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Contact</h2>
              <p className="mt-1">For privacy questions, contact: <span className="font-medium">nithindaskavungal@gmail.com</span></p>
            </section>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-slate-600">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-blue-600" />
              You can revoke Google account access at any time from your Google Account permissions panel.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyPage;
