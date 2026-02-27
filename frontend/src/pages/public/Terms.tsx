import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: February 27, 2026</p>

          <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700">
            <p>
              By using LazyDraft, you agree to these terms. If you do not agree, do not use the service.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Service Scope</h2>
            <p>
              LazyDraft provides AI-assisted email drafting, sending, scheduling, recurring mail workflows, and
              analytics features.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">User Responsibilities</h2>
            <p>
              You are responsible for the emails you send, recipient data you provide, and compliance with
              applicable laws and platform policies.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Google Account Access</h2>
            <p>
              The app uses Google OAuth permissions to perform actions explicitly initiated by you. You can revoke
              access any time from your Google account settings.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Availability</h2>
            <p>
              We may update, suspend, or modify features for maintenance, security, or product improvements.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Limitation of Liability</h2>
            <p>
              LazyDraft is provided on an "as is" basis. To the extent allowed by law, we are not liable for
              indirect or consequential damages arising from service usage.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Contact</h2>
            <p>
              For terms-related questions, contact: <span className="font-medium">nithindaskavungal@gmail.com</span>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
