import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { RichText } from "@/components/content/RichText";
import { parseBlocks } from "@/components/content/richTextCore";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { RiskScore } from "@/components/content/RiskScore";
import { PhaseBadge } from "@/components/content/PhaseBadge";
import { EmptyState } from "@/components/content/EmptyState";
import { SourceNote } from "@/components/content/SourceNote";
import { mitigationsData } from "@/components/components/securityData";

const wrap = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const SAMPLE = `**Design Considerations:**
- Run tools in **Docker** containers with seccomp profiles (see AISVS C9.4 and V1.2.3)
- Map to T2 and M14; also ASI02
  - nested \`--read-only\` flag
1. First step
2. Second step

**Note:** Docker again, plus [OWASP](https://owasp.org) and [bad](javascript:alert(1)).

\`\`\`yaml
key: value
\`\`\``;

describe("parseBlocks", () => {
  it("parses headings, lists, labelled lines and code fences", () => {
    const blocks = parseBlocks(SAMPLE);
    expect(blocks.map((b) => b.type)).toEqual(["heading", "list", "list", "labelled", "code"]);
    const bullets = blocks[1] as Extract<(typeof blocks)[number], { type: "list" }>;
    expect(bullets.items.map((i) => i.depth)).toEqual([0, 0, 1]);
    expect((blocks[2] as { ordered: boolean }).ordered).toBe(true);
  });
});

describe("RichText", () => {
  it("renders structure, code links, safe links and one glossary tooltip per term", () => {
    wrap(<RichText text={SAMPLE} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Design Considerations" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AISVS C9.4" })).toHaveAttribute("href", "/aisvs#C9.4");
    expect(screen.getByRole("link", { name: "V1.2.3" })).toHaveAttribute("href", "/aisvs#V1.2.3");
    expect(screen.getByRole("link", { name: "T2" })).toHaveAttribute("href", "/threats/t2");
    expect(screen.getByRole("link", { name: "M14" })).toHaveAttribute("href", "/controls/m14");
    expect(screen.getByRole("link", { name: "ASI02" })).toHaveAttribute(
      "href",
      "/taxonomy?tab=owasp-agentic&entry=ASI02",
    );
    expect(screen.getByRole("link", { name: "OWASP" })).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    // Glossary: Docker appears twice, tooltip trigger only on the first; seccomp once.
    expect(screen.getAllByRole("button", { name: "Docker" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "seccomp" })).toHaveLength(1);
    expect(screen.getByText("--read-only").tagName).toBe("CODE");
    expect(document.querySelector("pre[data-lang=yaml]")).toHaveTextContent("key: value");
  });

  it("compact variant, glossary off and code links off", () => {
    wrap(
      <RichText text="Use Docker for T7" variant="compact" glossary={false} linkCodes={false} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Use Docker for T7")).toBeInTheDocument();
  });

  it("does not link C2 used as command-and-control", () => {
    wrap(<RichText text="Block C2 servers; see C2 for input validation" glossary={false} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders legacy-compatible checklist ids", () => {
    const onToggle = vi.fn();
    wrap(
      <RichText
        text={"- First task\n- Second task"}
        checklist={{
          idPrefix: "design-phase",
          isChecked: (id) => id === "design-phase-1",
          onToggle,
        }}
      />,
    );
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(2);
    expect(boxes[1]).toHaveAttribute("data-state", "checked");
    fireEvent.click(boxes[0]);
    expect(onToggle).toHaveBeenCalledWith("design-phase-0", true);
  });

  it("renders the sample with a stable block structure", () => {
    const { container } = wrap(<RichText text={SAMPLE} />);
    const outline = [...container.querySelectorAll("h3,h4,ul,ol,li,p,pre")].map((el) => el.tagName);
    expect(outline).toEqual(["H3", "UL", "LI", "LI", "LI", "OL", "LI", "LI", "H4", "P", "PRE"]);
  });

  it("renders every mitigation's implementation text without throwing", () => {
    for (const m of Object.values(mitigationsData)) {
      for (const text of Object.values(m.implementationDetail)) {
        const { unmount, container } = wrap(<RichText text={text} />);
        if (text?.trim()) expect(container.textContent?.length).toBeGreaterThan(0);
        unmount();
      }
    }
  });
});

describe("content badges", () => {
  it("SeverityBadge derives bands and keeps text when abbreviated", () => {
    wrap(
      <>
        <SeverityBadge score={9} showScore />
        <SeverityBadge band="medium" showLabel={false} />
        <SeverityBadge score={9.2} scale="aivss" />
      </>,
    );
    expect(screen.getAllByText("Critical")).toHaveLength(2);
    expect(screen.getByText("Medium severity")).toHaveClass("sr-only");
    expect(document.querySelector('[data-band="critical"]')?.className).toContain(
      "--security-critical",
    );
  });

  it("RiskScore is a neutral meter by default", () => {
    wrap(<RiskScore score={8} />);
    const meter = screen.getByRole("meter", { name: "Addresses risk" });
    expect(meter).toHaveAttribute("aria-valuenow", "8");
    expect(meter.className).toContain("bg-muted/40");
  });

  it("PhaseBadge marks inactive phases for screen readers", () => {
    wrap(<PhaseBadge phase="build" active={false} />);
    expect(screen.getByText("(not applicable)")).toHaveClass("sr-only");
  });

  it("EmptyState renders an action", () => {
    const onClick = vi.fn();
    wrap(<EmptyState icon="filter" title="No matches" action={{ label: "Reset", onClick }} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("No matches");
  });

  it("SourceNote formats provenance", () => {
    wrap(
      <SourceNote
        source={{
          name: "OWASP AISVS",
          version: "1.01",
          url: "https://owasp.org/aisvs",
          retrievedAt: "2026-11-03",
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /OWASP AISVS 1.01/ });
    expect(link).toHaveAttribute("href", "https://owasp.org/aisvs");
    expect(within(link.parentElement as HTMLElement).getByText("3 Nov 2026")).toBeInTheDocument();
  });
});
