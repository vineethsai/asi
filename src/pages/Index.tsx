import HeroSection from "@/components/home/HeroSection";
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
        <title>OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="Interactive guide for securing AI agentic applications using OWASP best practices. Explore architectures, threats, and controls." />
        <meta name="keywords" content="AI security, OWASP, agentic systems, AI threats, AI mitigations, AI architectures, security guide, LLM security, agent security, AI best practices" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://asi.lovable.dev/" />
        <meta property="og:url" content="https://asi.lovable.dev/" />
        <meta name="twitter:url" content="https://asi.lovable.dev/" />
      </Helmet>
      <Header />
      <main>
        <HeroSection />
        <ArchitectureGraphSection />
        <ArchitectureSection />
        <ComponentsSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
