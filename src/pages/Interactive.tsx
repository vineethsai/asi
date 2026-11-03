import { SecurityChecklist } from "@/components/interactive/SecurityChecklist";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";

export default function Interactive() {
  return (
    <PageLayout
      title="Security Checklist"
      description="Step-by-step AI security implementation checklist with progress tracking, code examples and OWASP AISVS references for securing agentic AI systems."
      canonicalPath="/interactive"
      keywords="AI security checklist, AI agent security implementation, secure AI development, OWASP AISVS, agentic systems security, security controls checklist"
    >
      <PageHeader
        eyebrow="Tools"
        title="Security Checklist"
        description="A step-by-step implementation guide with code examples and OWASP AISVS references. Tick items off as you go; progress stays in this browser."
      />
      <SecurityChecklist />
    </PageLayout>
  );
}
