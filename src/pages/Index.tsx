import HeroSection from "@/components/home/HeroSection";
import ArchitectureGraphSection from "@/components/home/ArchitectureGraphSection";
import ArchitectureShowcase from "@/components/home/ArchitectureShowcase";
import PageLayout from "@/components/layout/PageLayout";
import { usePageTracking } from "@/hooks/useAnalytics";

const DESCRIPTION =
  "Interactive guide to securing agentic AI applications: OWASP agentic threats and mitigations, AISVS verification requirements, NIST AI RMF mapping, a framework taxonomy and a threat modeler.";

const Index = () => {
  usePageTracking("Homepage - AI Agents Security Guide", {
    page_type: "homepage",
    content_category: "ai_security",
  });

  return (
    <PageLayout
      title="Agentic Security Hub — OWASP guide to securing AI agents"
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
      <ArchitectureShowcase />
      <ArchitectureGraphSection />
    </PageLayout>
  );
};

export default Index;
