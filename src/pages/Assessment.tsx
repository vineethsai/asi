
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AssessmentTool from "@/components/assessment/AssessmentTool";
import { Helmet } from "react-helmet";

const Assessment = () => {
  return (
    <>
      <Helmet>
        <title>AI Security Assessment Tool | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="Interactive security assessment tool for agentic AI systems. Evaluate risks, identify threats, and get tailored security recommendations for your AI architecture." />
        <meta name="keywords" content="AI security assessment, OWASP assessment tool, AI risk evaluation, agentic systems security, LLM security assessment, AI threat analysis, security audit tool" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/assessment" />
        <meta property="og:title" content="AI Security Assessment Tool | OWASP Guide" />
        <meta property="og:description" content="Interactive security assessment tool for agentic AI systems. Evaluate risks and get tailored security recommendations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/assessment" />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Security Assessment Tool | OWASP Guide" />
        <meta name="twitter:description" content="Interactive security assessment tool for agentic AI systems. Evaluate risks and get tailored security recommendations." />
        <meta name="twitter:url" content="https://agenticsecurity.info/assessment" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AI Security Assessment Tool",
            "description": "Interactive security assessment tool for agentic AI systems",
                         "url": "https://agenticsecurity.info/assessment",
            "applicationCategory": "SecurityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "provider": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            }
          })}
        </script>
      </Helmet>
      <Header />
      <main className="container py-12">
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Architecture Security Assessment</h1>
          <p className="text-muted-foreground">
            Use this interactive tool to evaluate security risks and controls 
            for your specific agentic AI architecture and components.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <AssessmentTool />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Assessment;
