import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import {
  TrustBar,
  Journey,
  Features,
  Testimonials,
  About,
  Resources,
  FinalCTA,
} from "@/components/Sections";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { faqs } from "@/lib/content";

// SEO: structured data so search engines can render rich results.
function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Leadly",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Find weak local websites and turn them into paying clients. Leadly finds local businesses, audits their sites, scores them 0–100 and writes honest outreach.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "0",
          highPrice: "375",
          offerCount: "4",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <Header />
      <main id="main">
        <Hero />
        <TrustBar />
        <Journey />
        <Features />
        <Testimonials />
        <Pricing />
        <About />
        <Resources />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
