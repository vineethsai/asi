import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, ChevronRight, Target, Database, Zap } from "lucide-react";
import {
  ciscoTaxonomyData,
  getTaxonomyStats,
  parseMappingBadge,
  getMappingColor,
} from "@/components/components/ciscoTaxonomyData";

const categoryIcons: Record<string, React.ReactNode> = {
  "Common Manipulation Risks": <Target className="h-4 w-4" />,
  "Data-Related Risks": <Database className="h-4 w-4" />,
  "Downstream / Impact Risks": <Zap className="h-4 w-4" />,
};

const categoryBgColors: Record<string, string> = {
  "Common Manipulation Risks": "border-l-red-500",
  "Data-Related Risks": "border-l-amber-500",
  "Downstream / Impact Risks": "border-l-violet-500",
};

function MappingBadges({ mappings }: { mappings: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {mappings.map((m, i) => {
        const parsed = parseMappingBadge(m);
        if (parsed.code === "N/A") return null;
        const colorClass = getMappingColor(parsed.framework);
        const linkTo =
          parsed.framework === "OWASP" && parsed.code.startsWith("ASI")
            ? "/owasp-agentic-top10"
            : parsed.framework === "NIST AML"
              ? "/nist-mapping"
              : undefined;

        const badge = (
          <Badge key={i} variant="outline" className={`text-xs ${colorClass} cursor-default`}>
            {parsed.framework}: {parsed.code}
          </Badge>
        );

        if (linkTo) {
          return (
            <Link key={i} to={linkTo}>
              {badge}
            </Link>
          );
        }
        return badge;
      })}
    </div>
  );
}

export function CiscoTaxonomyContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const stats = getTaxonomyStats();

  const categories = useMemo(() => {
    const cats = new Set<string>();
    ciscoTaxonomyData.forEach((og) => cats.add(og.objective_group));
    return Array.from(cats);
  }, []);

  const filteredData = useMemo(() => {
    let data = ciscoTaxonomyData;
    if (selectedCategory !== "all") {
      data = data.filter((og) => og.objective_group === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((og) => {
        if (
          og.code.toLowerCase().includes(q) ||
          og.description.toLowerCase().includes(q) ||
          og.definition.toLowerCase().includes(q)
        )
          return true;
        return og.ai_tech.some(
          (t) =>
            t.code.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.definition.toLowerCase().includes(q) ||
            t.mappings.some((m) => m.toLowerCase().includes(q)) ||
            t.ai_subtech.some(
              (s) =>
                s.code.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.definition.toLowerCase().includes(q) ||
                s.mappings.some((m) => m.toLowerCase().includes(q)),
            ),
        );
      });
    }
    return data;
  }, [searchQuery, selectedCategory]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cisco AI Security Taxonomy</h1>
        <p className="mt-1 text-muted-foreground">
          Comprehensive AI/ML threat taxonomy covering {stats.objectiveGroups} objective groups,{" "}
          {stats.techniques} techniques, and {stats.subTechniques} sub-techniques with
          cross-framework mappings to OWASP, MITRE ATLAS, MITRE ATT&CK, and NIST.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
        <span>
          <strong className="text-foreground">{stats.objectiveGroups}</strong> Objective Groups
        </span>
        <span>
          <strong className="text-foreground">{stats.techniques}</strong> Techniques
        </span>
        <span>
          <strong className="text-foreground">{stats.subTechniques}</strong> Sub-Techniques
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search objectives, techniques, mappings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory("all")}
          >
            All ({ciscoTaxonomyData.length})
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryIcons[cat]} {cat} (
              {ciscoTaxonomyData.filter((og) => og.objective_group === cat).length})
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.map((og) => (
          <Card
            key={og.code}
            className={`border-l-4 ${categoryBgColors[og.objective_group] || "border-l-gray-500"}`}
          >
            <Accordion type="single" collapsible>
              <AccordionItem value={og.code} className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex flex-col items-start text-left w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {og.code}
                      </Badge>
                      <span className="font-semibold text-lg">{og.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {categoryIcons[og.objective_group]}
                      <span className="text-xs text-muted-foreground">{og.objective_group}</span>
                      <span className="text-xs text-muted-foreground">
                        | {og.ai_tech.length} technique(s)
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {og.definition}
                  </p>
                  {og.mappings.length > 0 && <MappingBadges mappings={og.mappings} />}

                  <div className="mt-4 space-y-3">
                    {og.ai_tech.map((tech) => (
                      <Card key={tech.code} className="bg-muted/30">
                        <Accordion type="single" collapsible>
                          <AccordionItem value={tech.code} className="border-none">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2 text-left">
                                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {tech.code}
                                </Badge>
                                <span className="font-medium text-sm">{tech.description}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-3">
                              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                {tech.definition}
                              </p>
                              <MappingBadges mappings={tech.mappings} />

                              {tech.ai_subtech.length > 0 && (
                                <div className="mt-3 ml-4 space-y-2">
                                  {tech.ai_subtech.map((sub) => (
                                    <div
                                      key={sub.code}
                                      className="border-l-2 border-muted-foreground/20 pl-4 py-2"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {sub.code}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                          {sub.description}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {sub.definition}
                                      </p>
                                      <MappingBadges mappings={sub.mappings} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      )}
    </>
  );
}

export default function CiscoTaxonomy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <CiscoTaxonomyContent />
      </main>
      <Footer />
    </div>
  );
}
