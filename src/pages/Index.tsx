import HeroSection from "@/components/home/HeroSection";
import ArchitectureGraphSection from "@/components/home/ArchitectureGraphSection";
import ArchitectureShowcase from "@/components/home/ArchitectureShowcase";
import ChallengeSection from "@/components/home/ChallengeSection";
import FeaturedThreatCard from "@/components/home/FeaturedThreatCard";
import HowToUseStrip from "@/components/home/HowToUseStrip";
import ProgressCard from "@/components/home/ProgressCard";
import PageLayout from "@/components/layout/PageLayout";
import { usePageTracking } from "@/hooks/useAnalytics";
import { useReveal } from "@/hooks/useReveal";
import { stagger } from "@/lib/motion";

const DESCRIPTION =
  "OWASP-aligned guide to agentic AI security: AI agent threats and controls, OWASP AISVS requirements, NIST AI RMF mapping and a free in-browser threat modeler.";

/** Featured threat + progress, two columns on desktop (6.1 item 6). */
function TodaySection() {
  const { ref } = useReveal<HTMLDivElement>();
  return (
    <section className="py-6" aria-label="Today">
      <div ref={ref} className="container grid gap-4 px-4 md:px-6 lg:grid-cols-2">
        <div className="enter" style={stagger(0)}>
          <FeaturedThreatCard />
        </div>
        <div className="enter" style={stagger(1)}>
          <ProgressCard />
        </div>
      </div>
    </section>
  );
}

const Index = () => {
  usePageTracking("Homepage - AI Agents Security Guide", {
    page_type: "homepage",
    content_category: "ai_security",
  });

  return (
    <PageLayout
      title="OWASP Agentic AI Security: AI Agent Threats, AISVS & Threat Modeling"
      description={DESCRIPTION}
      canonicalPath="/"
      keywords="AI agents security, agentic AI security, OWASP, AISVS, NIST AI RMF mapping, AI security controls, AI agent threats, threat modeling, LLM security"
      wide
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Agentic Security Hub",
        description: DESCRIPTION,
        url: "https://agenticsecurity.info/",
        publisher: {
          "@type": "Organization",
          name: "OWASP Securing Agentic Applications",
          url: "https://owasp.org/www-project-securing-agentic-applications/",
        },
        about: [
          { "@type": "Thing", name: "AI agent security" },
          { "@type": "Thing", name: "NIST AI RMF" },
          { "@type": "Thing", name: "OWASP AISVS" },
        ],
      }}
    >
      <HeroSection />
      <TodaySection />
      <ArchitectureShowcase />
      <ArchitectureGraphSection />
      <HowToUseStrip />
      <ChallengeSection />
    </PageLayout>
  );
};

export default Index;
