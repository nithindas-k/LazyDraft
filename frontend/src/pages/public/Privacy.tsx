import React from "react";

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: February 27, 2026</p>

          <section className="mt-8 space-y-4 text-sm leading-6 text-slate-700">
            <p>
              LazyDraft helps users draft and send emails from their own Google account. We only request
              access required to provide core features such as email drafting, sending, history, and analytics.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Data We Access</h2>
            <p>
              We may access profile details (name, email) and limited Gmail scopes needed for sending emails and
              reading metadata required for app features.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">How We Use Data</h2>
            <p>
              Data is used only to operate LazyDraft features, improve reliability, and provide user-visible
              analytics within your account experience.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Data Sharing</h2>
            <p>
              We do not sell personal data. We do not share user email content with third parties except when
              required to provide integrated services selected by the user.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Security</h2>
            <p>
              We use industry-standard controls to protect access tokens and account data. Access is restricted
              and monitored for operational safety.
            </p>

            <h2 className="pt-2 text-base font-semibold text-slate-900">Contact</h2>
            <p>
              For privacy questions, contact: <span className="font-medium">nithindaskavungal@gmail.com</span>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
