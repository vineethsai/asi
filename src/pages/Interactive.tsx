import { Helmet } from "react-helmet";
import { SecurityChecklist } from "@/components/interactive/SecurityChecklist";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Interactive() {
  return (
    <>
      <Helmet>
        <title>Security Implementation Checklist | Agentic Security Hub</title>
        <meta
          name="description"
          content="Step-by-step AI security implementation checklist with progress tracking, code examples, and OWASP AISVS references for securing agentic AI systems."
        />
        <meta
          name="keywords"
          content="AI security checklist, AI agent security implementation, secure AI development, OWASP AISVS, agentic systems security, security controls checklist"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/interactive" />
        <meta
          property="og:title"
          content="Security Implementation Checklist | Agentic Security Hub"
        />
        <meta
          property="og:description"
          content="Step-by-step AI security implementation checklist with progress tracking and code examples."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/interactive" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Security Implementation Checklist | Agentic Security Hub"
        />
        <meta
          name="twitter:description"
          content="Step-by-step AI security implementation checklist with progress tracking and code examples."
        />
      </Helmet>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Interactive Tools</h1>
          <p className="mt-1 text-muted-foreground">
            A step-by-step implementation guide with progress tracking, code examples, and AISVS
            references to help you systematically apply security controls to your agentic AI
            systems.
          </p>
        </div>

        {/* Checklist */}
        <SecurityChecklist />
      </main>
      <Footer />
    </>
  );
}
