import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  BookOpen,
  GitBranch,
  Users,
  ExternalLink,
  ArrowRight,
  Target,
  Layers,
  CheckCircle2,
} from "lucide-react";

const methodology = [
  {
    step: "1",
    title: "Component Analysis",
    description:
      "Identify the 6 key components of agentic AI systems and their security boundaries.",
    link: "/components",
  },
  {
    step: "2",
    title: "Threat Modeling",
    description:
      "Map threats to each component using our threat catalog of 15+ identified attack vectors.",
    link: "/threats",
  },
  {
    step: "3",
    title: "Control Selection",
    description:
      "Select appropriate security controls from 100+ mitigations organized by lifecycle phase.",
    link: "/controls",
  },
  {
    step: "4",
    title: "AISVS Verification",
    description:
      "Verify implementation against the AI Security Verification Standard with 13 categories.",
    link: "/aisvs",
  },
  {
    step: "5",
    title: "NIST Alignment",
    description:
      "Map security posture to the NIST AI Risk Management Framework for governance compliance.",
    link: "/nist-mapping",
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>About | Agentic Security Hub - OWASP</title>
        <meta
          name="description"
          content="Learn about the OWASP Securing Agentic Applications project, our methodology, framework, and how to contribute to improving AI agent security."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/about" />
        <meta property="og:title" content="About | Agentic Security Hub" />
        <meta
          property="og:description"
          content="Learn about the OWASP Securing Agentic Applications project, our methodology, and how to contribute."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/about" />
      </Helmet>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-sm">
            OWASP Project
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            About the Agentic Security Hub
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            An interactive companion to the OWASP Securing Agentic Applications guide, providing
            security practitioners with actionable tools, frameworks, and verification standards for
            building secure AI agent systems.
          </p>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Provide comprehensive, practical security guidance for organizations developing and
                deploying AI agentic systems. We bridge the gap between security theory and
                implementation with interactive tools.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                Scope
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Covers the full lifecycle of agentic AI security: from component-level threat
                modeling and architecture patterns to verification standards and operational
                monitoring aligned with NIST AI RMF.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
                Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built on 6 key components, 5 architecture patterns, 15 threat categories, 100+
                security controls, and 13 AISVS verification categories mapped to the NIST AI RMF.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Methodology */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-center">Methodology</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Our security framework follows a structured approach that guides practitioners from
            system analysis through implementation and governance verification.
          </p>
          <div className="grid gap-4">
            {methodology.map((step) => (
              <Card key={step.step} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Link to={step.link}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contributing */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-center">Contributing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" aria-hidden="true" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  This project is fully open source. We welcome contributions including new threat
                  research, control recommendations, vulnerability disclosures, and documentation
                  improvements.
                </p>
                <a
                  href="https://github.com/vineethsai/asi"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <GitBranch className="h-4 w-4 mr-2" />
                    View on GitHub
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  OWASP Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Part of the OWASP ecosystem for application security. Join the community to
                  collaborate on securing AI systems and share knowledge with security professionals
                  worldwide.
                </p>
                <a
                  href="https://owasp.org/www-project-securing-agentic-applications/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    OWASP Project Page
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Contribute */}
        <Card className="bg-muted/30">
          <CardContent className="p-8 space-y-4">
            <h3 className="text-xl font-semibold">How to Contribute</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Report vulnerabilities via GitHub issue templates",
                "Submit pull requests for new controls or threats",
                "Improve documentation and implementation guides",
                "Share feedback on the interactive assessment tools",
                "Add MITRE ATLAS technique mappings",
                "Help expand AISVS verification requirements",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
