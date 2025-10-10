import type { Metadata } from "next";

const LAST_UPDATED = "13 August 2024";

export const metadata: Metadata = {
  title: "Privacy Policy | My Year in the Chair",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-600">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          My Year in the Chair is administered by the Freemasons New Zealand Membership
          and Growth Committee. This Privacy Policy explains how we collect, use, share,
          and protect personal information when brethren, officers, and administrators
          use the platform.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Information We Collect</h2>
          <p>
            We collect the information you provide directly, including contact details,
            lodge affiliations, visit and event records, reports, and any additional
            context you submit through the platform. We also capture authentication
            metadata to keep your account secure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">How We Use Information</h2>
          <p>
            The Membership and Growth Committee uses personal data to manage accounts,
            facilitate approvals, maintain leaderboards, generate reports, and deliver
            communications related to the programme. Information may also be used to
            operate, secure, and improve the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Sharing of Information</h2>
          <p>
            We share information with other authorised committees of Freemasons New
            Zealand, including any Grand Lodge committee, when access is necessary to
            support membership engagement, reporting, or programme governance. We do not
            sell personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Data Retention and Security</h2>
          <p>
            Personal information is retained for as long as needed to deliver the
            programme and fulfil reporting obligations. We implement technical and
            organisational safeguards designed to protect data from unauthorised access,
            loss, or misuse.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Your Choices</h2>
          <p>
            You may access and update your profile information within the platform. If
            you have questions about your data, or wish to request corrections or
            removal, please contact the Membership and Growth Committee through the
            channels provided to you by Grand Lodge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            For privacy enquiries, contact the Freemasons New Zealand Membership and
            Growth Committee or the relevant Grand Lodge representative supporting the
            programme.
          </p>
        </section>
      </section>
    </div>
  );
}
