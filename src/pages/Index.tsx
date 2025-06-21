import HeroSection from "@/components/home/HeroSection";
import ComponentsSection from "@/components/home/ComponentsSection"; 
import ArchitectureGraphSection from "@/components/home/ArchitectureGraphSection";
import ArchitectureShowcase from "@/components/home/ArchitectureShowcase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>AI Agents Security Guide - OWASP NIST AI RMF Mapping | Secure AI Agent Development</title>
        <meta name="description" content="Comprehensive AI agents security guide with OWASP best practices, NIST AI RMF mapping for AI agents, security controls, and secure development frameworks for agentic AI systems and LLM-based applications." />
        <meta name="keywords" content="AI agents security, AI security, agent security, agent architectures, AI security controls, NIST AI RMF mapping to AI agent, secure development for AI agents, OWASP AI security, agentic systems security, LLM security, AI agent threats, AI agent mitigations, secure AI development, AI governance, AI risk management, artificial intelligence security" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/" />
        <meta property="og:title" content="AI Agents Security Guide - OWASP NIST AI RMF Mapping" />
        <meta property="og:description" content="Master AI agents security with comprehensive OWASP guide, NIST AI RMF mapping, and secure development practices for agentic AI systems." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/" />
        <meta property="og:site_name" content="AI Agents Security Guide - OWASP" />
        <meta property="og:image" content="https://agenticsecurity.info/og-ai-agents-security.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Agents Security Guide - OWASP NIST AI RMF Mapping" />
        <meta name="twitter:description" content="Master AI agents security with comprehensive OWASP guide, NIST AI RMF mapping, and secure development practices for agentic AI systems." />
        <meta name="twitter:url" content="https://agenticsecurity.info/" />
        <meta name="twitter:image" content="https://agenticsecurity.info/og-ai-agents-security.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "AI Agents Security Guide - OWASP",
            "description": "Comprehensive guide for securing AI agents and agentic applications using OWASP best practices and NIST AI RMF mapping",
            "url": "https://agenticsecurity.info",
            "mainEntity": {
              "@type": "Guide",
              "name": "OWASP Securing Agentic Applications Guide",
              "description": "Security framework for AI agents with NIST AI RMF integration",
              "about": [
                {
                  "@type": "Thing",
                  "name": "AI Agents Security",
                  "description": "Security practices for artificial intelligence agents and agentic systems"
                },
                {
                  "@type": "Thing",
                  "name": "NIST AI RMF Mapping",
                  "description": "Mapping NIST AI Risk Management Framework to AI agent security"
                },
                {
                  "@type": "Thing",
                  "name": "Secure AI Development",
                  "description": "Best practices for secure development of AI agents and applications"
                }
              ]
            },
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://agenticsecurity.info/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "keywords": ["AI agents security", "AI security", "agent security", "agent architectures", "AI security controls", "NIST AI RMF", "secure AI development", "agentic systems"]
          })}
        </script>
      </Helmet>
      <Header />
      <main>
        <HeroSection />
        <ArchitectureShowcase />
        <ArchitectureGraphSection />
        <ComponentsSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
