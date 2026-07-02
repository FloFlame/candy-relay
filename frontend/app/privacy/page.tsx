import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy, Cookies & GDPR",
  description:
    "How Leadly collects, processes, stores and deletes data, our use of cookies, and your rights under the GDPR.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-600 dark:text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main" className="py-16 sm:py-20">
        <div className="container-tight max-w-3xl">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Privacy, Cookies &amp; GDPR
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Last updated: {new Date().getFullYear()}. This page explains, in
            plain language, how Leadly handles data. It is a template and should
            be reviewed by your legal counsel before launch.
          </p>

          <div className="mt-10 space-y-10">
            <Section id="data" title="What data we process">
              <p>
                Leadly works with two kinds of data. First, <strong>public
                business information</strong> — names, addresses and website
                URLs sourced from open map data — which we audit on your behalf.
                Second, <strong>your account data</strong> — your email,
                billing details and the leads you save.
              </p>
              <p>
                We do not buy or sell personal data, and we only audit websites
                that are already publicly accessible.
              </p>
            </Section>

            <Section id="gdpr" title="Your rights under the GDPR">
              <p>
                If you are in the EU/EEA you have the right to access, correct,
                export or delete your personal data, and to object to or
                restrict its processing. To exercise any of these rights, email{" "}
                <a href="mailto:privacy@getleadly.net" className="font-semibold text-brand-600 underline">
                  privacy@getleadly.net
                </a>{" "}
                and we will respond within 30 days.
              </p>
              <p>
                Our lawful basis for processing account data is the performance
                of our contract with you; for public business data it is our
                legitimate interest in providing the service.
              </p>
            </Section>

            <Section id="cookies" title="Cookies">
              <p>
                We use a small number of essential cookies required to run the
                app (for example, to keep you signed in and remember your theme
                preference). With your consent we may also use analytics cookies
                to understand how the site is used. You can accept or decline
                non-essential cookies via the banner shown on your first visit.
              </p>
            </Section>

            <Section id="storage" title="Storage, security & retention">
              <p>
                Data is stored on servers within the EU and encrypted in transit
                over HTTPS. We retain account data for as long as your account is
                active and delete it within 30 days of account closure, except
                where we are legally required to keep records (for example,
                invoices).
              </p>
            </Section>

            <Section id="terms" title="Terms of service">
              <p>
                Use of Leadly is subject to our terms of service. Outreach sent
                through or informed by Leadly must comply with applicable
                anti-spam and marketing laws in your jurisdiction. You are
                responsible for how you contact the businesses you discover.
              </p>
            </Section>

            <Section id="contact" title="Contact">
              <p>
                Questions about this policy? Email{" "}
                <a href="mailto:privacy@getleadly.net" className="font-semibold text-brand-600 underline">
                  privacy@getleadly.net
                </a>
                .
              </p>
            </Section>
          </div>

          <div className="mt-12">
            <a href="/" className="btn-ghost">← Back to home</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
