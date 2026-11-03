import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReferencesPage from "@/pages/References";
import { threatsData, mitigationsData } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { aisvsData } from "@/data/aisvs";
import {
  CITATION_COUNT,
  REFERENCES,
  buildReferenceIndex,
  domainLabel,
  filterReferences,
  formatBibtex,
  formatCitation,
  inferReferenceType,
  normalizeUrl,
  type Citation,
} from "@/components/references/referenceIndex";

const cite = (kind: Citation["kind"], id: string): Citation => ({
  kind,
  id,
  code: id.toUpperCase(),
  name: `Item ${id}`,
  href: `/x/${id}`,
});

describe("normalizeUrl", () => {
  it("merges scheme, www, trailing slash, case, fragment and tracking params", () => {
    const key = normalizeUrl("https://example.com/a/b");
    expect(normalizeUrl("http://www.example.com/a/b/")).toBe(key);
    expect(normalizeUrl("https://EXAMPLE.com/A/B#top")).toBe(key);
    expect(normalizeUrl("https://example.com/a/b?utm_source=x&ref=y")).toBe(key);
    expect(normalizeUrl("https://example.com/a/b?id=1")).not.toBe(key);
  });
  it("maps legacy NIST CSRC publication URLs onto the current scheme", () => {
    expect(normalizeUrl("https://csrc.nist.gov/publications/detail/sp/800-207/final")).toBe(
      normalizeUrl("https://csrc.nist.gov/pubs/sp/800/207/final"),
    );
    expect(normalizeUrl("https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final")).toBe(
      "https://csrc.nist.gov/pubs/sp/800/61/r2/final",
    );
  });
});

describe("inferReferenceType", () => {
  it.each([
    ["https://arxiv.org/abs/2407.12784", "paper"],
    ["https://www.usenix.org/conference/usenixsecurity20/presentation/fang", "paper"],
    ["https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/", "standard"],
    ["https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf", "standard"],
    ["https://atlas.mitre.org/techniques/AML.T0051", "standard"],
    ["https://github.com/OWASP/AISVS/blob/main/1.01/en/0x10-C10-MCP-Security.md", "standard"],
    ["https://spdx.github.io/spdx-spec/", "standard"],
    ["https://github.com/sigstore/model-transparency", "tool"],
    ["https://gvisor.dev/docs/architecture_guide/security/", "tool"],
    ["https://www.promptfoo.dev/blog/rag-poisoning/", "blog"],
    ["https://embracethered.com/blog/posts/2025/x/", "blog"],
    ["https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-142a", "standard"],
    ["https://example.org/whitepaper.pdf", "paper"],
    ["https://example.org/some-post", "blog"],
  ])("%s → %s", (url, type) => {
    expect(inferReferenceType(url)).toBe(type);
  });
});

describe("buildReferenceIndex", () => {
  it("de-duplicates by URL, keeps every citer once and prefers the canonical spelling", () => {
    const index = buildReferenceIndex([
      {
        url: "https://csrc.nist.gov/publications/detail/sp/800-190/final",
        title: "NIST Container Security",
        citation: cite("threat", "t1"),
      },
      {
        url: "https://csrc.nist.gov/pubs/sp/800/190/final",
        title: "NIST SP 800-190: Application Container Security Guide",
        citation: cite("control", "m2"),
      },
      {
        url: "https://csrc.nist.gov/pubs/sp/800/190/final/",
        title: "NIST Container Security",
        citation: cite("threat", "t1"),
      },
    ]);
    expect(index).toHaveLength(1);
    const [entry] = index;
    expect(entry.url).toBe("https://csrc.nist.gov/pubs/sp/800/190/final");
    expect(entry.title).toBe("NIST SP 800-190: Application Container Security Guide");
    expect(entry.alsoCitedAs).toEqual(["NIST Container Security"]);
    expect(entry.citedBy.map((c) => `${c.kind}:${c.id}`)).toEqual(["threat:t1", "control:m2"]);
    expect(entry.type).toBe("standard");
  });

  it("covers every link in the data with unique keys and in-app back-links", () => {
    const urls = new Set<string>();
    Object.values(threatsData).forEach((t) => t.references?.forEach((r) => urls.add(r.url)));
    Object.values(mitigationsData).forEach((m) => m.references?.forEach((r) => urls.add(r.url)));
    Object.values(aisvsData).forEach((c) => c.references.forEach((r) => urls.add(r.url)));
    agenticTop10Data.forEach((e) => e.references.forEach((r) => urls.add(r.url)));

    const keys = REFERENCES.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    const covered = new Set(REFERENCES.flatMap((r) => [r.url, ...r.variants]));
    for (const u of urls) expect(covered.has(u.trim())).toBe(true);
    expect(REFERENCES.length).toBeLessThanOrEqual(urls.size);
    expect(CITATION_COUNT).toBe(REFERENCES.reduce((n, r) => n + r.citedBy.length, 0));
    for (const r of REFERENCES) {
      expect(r.citedBy.length).toBeGreaterThan(0);
      for (const c of r.citedBy) expect(c.href).toMatch(/^\/(threats|controls|aisvs|taxonomy)/);
    }
  });

  it("filters by type, citing kind and query (including a citing code)", () => {
    const standards = filterReferences(REFERENCES, { query: "", type: "standard", citedBy: null });
    expect(standards.length).toBeGreaterThan(0);
    expect(standards.every((r) => r.type === "standard")).toBe(true);
    const asi = filterReferences(REFERENCES, { query: "", type: null, citedBy: "asi" });
    expect(asi.every((r) => r.citedBy.some((c) => c.kind === "asi"))).toBe(true);
    const byCode = filterReferences(REFERENCES, { query: "asi01", type: null, citedBy: null });
    expect(byCode.length).toBeGreaterThan(0);
    expect(
      byCode.every(
        (r) => r.citedBy.some((c) => c.code === "ASI01") || /asi01/i.test(r.title + r.url),
      ),
    ).toBe(true);
  });
});

describe("citations", () => {
  const entry = buildReferenceIndex([
    {
      url: "https://csrc.nist.gov/pubs/sp/800/207/final",
      title: "NIST SP 800-207: Zero Trust Architecture",
      citation: cite("control", "m3"),
    },
  ])[0];
  const date = new Date("2026-11-03T12:00:00Z");
  it("formats a plain-text citation with publisher, title, URL and access date", () => {
    expect(formatCitation(entry, date)).toBe(
      'National Institute of Standards and Technology (NIST). "NIST SP 800-207: Zero Trust Architecture." https://csrc.nist.gov/pubs/sp/800/207/final (accessed 2026-11-03).',
    );
  });
  it("formats a BibTeX @misc entry", () => {
    const bib = formatBibtex(entry, date);
    expect(bib).toMatch(/^@misc\{nist_sp_800_207,/);
    expect(bib).toContain("howpublished = {\\url{https://csrc.nist.gov/pubs/sp/800/207/final}}");
    expect(bib).toContain("note         = {Accessed: 2026-11-03}");
  });
  it("labels GitHub links with their owner (text only)", () => {
    expect(domainLabel("https://github.com/OWASP/AISVS")).toBe("github.com/OWASP");
    expect(domainLabel("https://www.iso.org/standard/42001")).toBe("iso.org");
  });
});

function renderAt(url: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[url]}>
        <ReferencesPage />
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("References page", () => {
  it("renders one h1, a card per reference and no favicon images", () => {
    const { container } = renderAt("/references");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("article")).toHaveLength(REFERENCES.length);
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).not.toContain("s2/favicons");
  });

  it("applies the type facet from the URL and toggles it with aria-pressed buttons", () => {
    renderAt("/references?type=standard");
    const standards = REFERENCES.filter((r) => r.type === "standard").length;
    expect(screen.getAllByRole("article")).toHaveLength(standards);
    const group = screen.getByRole("group", { name: "Filter by reference type" });
    const papers = within(group).getByRole("button", { name: /^Papers/ });
    expect(papers).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(papers);
    expect(papers).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("article")).toHaveLength(
      REFERENCES.filter((r) => r.type === "paper").length,
    );
  });

  it("links cited-by chips back to the citing item and opens the cite panel", () => {
    renderAt("/references?type=standard&q=800-207");
    const [card] = screen.getAllByRole("article");
    const chip = within(card)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.startsWith("/"));
    expect(chip).toBeDefined();
    const citeBtn = within(card).getByRole("button", { name: "Cite" });
    expect(citeBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(citeBtn);
    expect(citeBtn).toHaveAttribute("aria-expanded", "true");
    expect(within(card).getByRole("button", { name: /Copy citation/ })).toBeInTheDocument();
  });

  it("shows an empty state that clears filters", () => {
    renderAt("/references?q=zzzz-no-such-reference");
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(REFERENCES.length);
  });

  it("groups by domain with a heading per host", () => {
    renderAt("/references?view=domain");
    const hosts = new Set(REFERENCES.map((r) => r.host));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(hosts.size);
  });
});
