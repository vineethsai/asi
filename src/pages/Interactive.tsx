import { SecurityChecklist } from "@/components/interactive/SecurityChecklist";
import PageLayout from "@/components/layout/PageLayout";

export default function Interactive() {
  return (
    <PageLayout
      title="Security Checklist"
      description="Step-by-step AI security implementation checklist with progress tracking, code examples, and OWASP AISVS references for securing agentic AI systems."
      canonicalPath="/interactive"
      keywords="AI security checklist, AI agent security implementation, secure AI development, OWASP AISVS, agentic systems security, security controls checklist"
      className="space-y-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Security Checklist</h1>
        <p className="mt-1 text-muted-foreground">
          A step-by-step implementation guide with progress tracking, code examples, and AISVS
          references to help you systematically apply security controls to your agentic AI systems.
        </p>
      </div>

      <SecurityChecklist />
    </PageLayout>
  );
}
