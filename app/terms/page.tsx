import type { Metadata } from "next";

const LAST_UPDATED = "13 August 2024";

export const metadata: Metadata = {
  title: "Terms of Service | My Year in the Chair",
};

export default function TermsOfServicePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-600">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          These Terms of Service govern your use of My Year in the Chair, operated by the
          Freemasons New Zealand Membership and Growth Committee. By accessing or using
          the platform you agree to comply with these terms.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Eligibility and Accounts</h2>
          <p>
            Access is limited to authorised Freemasons New Zealand members and
            administrators. You are responsible for safeguarding your credentials and for
            all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Acceptable Use</h2>
          <p>
            You agree to use the platform for legitimate lodge administration,
            membership, and reporting purposes. You must not misuse the service, attempt
            to circumvent security, or share access with unauthorised parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Data Usage</h2>
          <p>
            Information collected through the platform may be used by the Membership and
            Growth Committee and any authorised Freemasons New Zealand Grand Lodge
            committee to support governance, reporting, and programme delivery. Use of
            the service constitutes consent to this sharing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Content and Intellectual Property</h2>
          <p>
            The platform, including all content and software, is owned or licensed by
            Freemasons New Zealand. You may not copy, modify, or distribute materials
            except as required for official duties within the organisation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Termination</h2>
          <p>
            Access may be suspended or terminated at any time for breach of these terms
            or at the direction of the Membership and Growth Committee or another
            authorised Grand Lodge committee.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Disclaimer</h2>
          <p>
            The service is provided on an &quot;as is&quot; basis. While we strive for accuracy and
            availability, Freemasons New Zealand disclaims warranties to the fullest
            extent permitted by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions about these terms should be directed to the Freemasons New Zealand
            Membership and Growth Committee.
          </p>
        </section>
      </section>
    </div>
  );
}
