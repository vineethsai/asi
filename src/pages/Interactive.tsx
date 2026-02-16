import { Helmet } from "react-helmet";
import { SecurityChecklist } from "@/components/interactive/SecurityChecklist";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckSquare, Zap } from "lucide-react";

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
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Interactive Security Guidance
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Security Implementation
            <span className="block text-primary">Checklist</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A step-by-step implementation guide with progress tracking, code examples, and AISVS
            references to help you systematically apply security controls to your agentic AI
            systems.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            <span>Your progress is saved automatically in your browser.</span>
          </div>
        </div>

        {/* Checklist */}
        <SecurityChecklist />
      </main>
      <Footer />
    </>
  );
}
