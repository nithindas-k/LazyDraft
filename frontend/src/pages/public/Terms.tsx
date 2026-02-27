import React from "react";
import { Link } from "react-router-dom";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_ROUTES } from "@/constants/routes";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100/70">
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border border-slate-200 bg-white text-slate-700 hover:bg-white">
            <FileCheck2 className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Terms
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to={APP_ROUTES.HOME}>Back to App</Link>
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 sm:text-3xl">Terms of Service</CardTitle>
            <CardDescription>Last updated: February 27, 2026</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-5 pt-6 text-sm leading-6 text-slate-700">
            <p>
              By using LazyDraft, you agree to these terms. If you do not agree, do not use the service.
            </p>

            <section>
              <h2 className="font-semibold text-slate-900">Service Scope</h2>
              <p className="mt-1">LazyDraft provides AI-assisted email drafting, sending, scheduling, recurring mail workflows, and analytics features.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">User Responsibilities</h2>
              <p className="mt-1">You are responsible for the emails you send, recipient data you provide, and compliance with applicable laws and platform policies.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Google Account Access</h2>
              <p className="mt-1">The app uses Google OAuth permissions to perform actions explicitly initiated by you. You can revoke access any time from your Google account settings.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Availability</h2>
              <p className="mt-1">We may update, suspend, or modify features for maintenance, security, or product improvements.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Limitation of Liability</h2>
              <p className="mt-1">LazyDraft is provided on an &quot;as is&quot; basis. To the extent allowed by law, we are not liable for indirect or consequential damages arising from service usage.</p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-900">Contact</h2>
              <p className="mt-1">For terms-related questions, contact: <span className="font-medium">nithindaskavungal@gmail.com</span></p>
            </section>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-slate-600">
              <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />
              You can stop using the service at any time by disconnecting your Google account permissions.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TermsPage;
