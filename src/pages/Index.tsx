import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import ComponentsSection from "@/components/home/ComponentsSection"; 
import ArchitectureSection from "@/components/home/ArchitectureSection";
import ArchitectureGraphSection from "@/components/home/ArchitectureGraphSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>OWASP Securing Agentic Applications Guide - NIST AI RMF Mapping & AI Security Framework</title>
        <meta name="description" content="Comprehensive OWASP guide for securing AI agentic applications with interactive NIST AI RMF mapping, D3.js visualizations, security assessments, and threat analysis for LLM-based systems." />
        <meta name="keywords" content="AI security, OWASP, NIST AI RMF, agentic systems, AI threats, AI mitigations, AI architectures, security guide, LLM security, agent security, AI best practices, AI assessment, security framework, AISVS, interactive mapping, D3.js visualization" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/" />
        <meta property="og:title" content="OWASP Securing Agentic Applications Guide" />
        <meta property="og:description" content="Comprehensive OWASP guide for securing AI agentic applications with interactive tools and security assessments." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/" />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:description" content="Comprehensive OWASP guide for securing AI agentic applications with interactive tools and security assessments." />
        <meta name="twitter:url" content="https://agenticsecurity.info/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "OWASP Securing Agentic Applications Guide",
            "description": "Comprehensive guide for securing AI agentic applications using OWASP best practices",
            "url": "https://agenticsecurity.info",
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://agenticsecurity.info/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ArchitectureGraphSection />
        <ArchitectureSection />
        <ComponentsSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
