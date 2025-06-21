import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Search, BookOpen, Shield, Target, Database } from "lucide-react";
import { Helmet } from "react-helmet";
import { usePageTracking } from "@/hooks/useAnalytics";
import { threatsData, mitigationsData, aisvsData } from "@/components/components/securityData";

interface Reference {
  title: string;
  url: string;
  source: string;
  sourceId: string;
  sourceType: "threat" | "mitigation" | "aisvs";
  sourceName: string;
}

const References = () => {
  usePageTracking("References - AI Security Resources", {
    page_type: "references",
    content_category: "resources"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Collect all references from different data sources
  const allReferences = useMemo(() => {
    const references: Reference[] = [];

    // Collect from threats
    Object.values(threatsData).forEach(threat => {
      if (threat.references) {
        threat.references.forEach(ref => {
          references.push({
            title: ref.title,
            url: ref.url,
            source: threat.code,
            sourceId: threat.id,
            sourceType: "threat",
            sourceName: threat.name
          });
        });
      }
    });

    // Collect from mitigations
    Object.values(mitigationsData).forEach(mitigation => {
      if (mitigation.references) {
        mitigation.references.forEach(ref => {
          references.push({
            title: ref.title,
            url: ref.url,
            source: mitigation.id,
            sourceId: mitigation.id,
            sourceType: "mitigation",
            sourceName: mitigation.name
          });
        });
      }
    });

    // Collect from AISVS
    Object.values(aisvsData).forEach(category => {
      if (category.references) {
        category.references.forEach(ref => {
          references.push({
            title: ref.title,
            url: ref.url,
            source: category.code,
            sourceId: category.id,
            sourceType: "aisvs",
            sourceName: category.name
          });
        });
      }

      // Also collect from AISVS requirements
      category.subCategories?.forEach(subCat => {
        subCat.requirements?.forEach(req => {
          if (req.references) {
            req.references.forEach(ref => {
              references.push({
                title: ref.title,
                url: ref.url,
                source: req.code,
                sourceId: req.id,
                sourceType: "aisvs",
                sourceName: req.title
              });
            });
          }
        });
      });
    });

    // Remove duplicates based on URL
    const uniqueReferences = references.filter((ref, index, self) => 
      index === self.findIndex(r => r.url === ref.url)
    );

    return uniqueReferences.sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Filter references
  const filteredReferences = useMemo(() => {
    return allReferences.filter(ref => {
      const matchesSearch = searchTerm === "" || 
        ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || ref.sourceType === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [allReferences, searchTerm, selectedType]);

  // Group references by domain for better organization
  const groupedByDomain = useMemo(() => {
    const groups: { [domain: string]: Reference[] } = {};
    
    filteredReferences.forEach(ref => {
      try {
        const domain = new URL(ref.url).hostname;
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(ref);
      } catch {
        // If URL parsing fails, group under "Other"
        if (!groups["Other"]) {
          groups["Other"] = [];
        }
        groups["Other"].push(ref);
      }
    });

    return groups;
  }, [filteredReferences]);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "threat": return <Target className="h-4 w-4 text-red-500" />;
      case "mitigation": return <Shield className="h-4 w-4 text-blue-500" />;
      case "aisvs": return <Database className="h-4 w-4 text-purple-500" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getSourceBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case "threat": return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";
      case "mitigation": return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300";
      case "aisvs": return "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300";
    }
  };

  const stats = useMemo(() => {
    const threatRefs = allReferences.filter(r => r.sourceType === "threat").length;
    const mitigationRefs = allReferences.filter(r => r.sourceType === "mitigation").length;
    const aisvsRefs = allReferences.filter(r => r.sourceType === "aisvs").length;
    const uniqueDomains = Object.keys(groupedByDomain).length;

    return { threatRefs, mitigationRefs, aisvsRefs, uniqueDomains, total: allReferences.length };
  }, [allReferences, groupedByDomain]);

  return (
    <>
      <Helmet>
        <title>References & Resources | AI Agents Security Guide</title>
        <meta name="description" content="Comprehensive collection of references and resources for AI agents security, including research papers, standards, tools, and documentation from OWASP AISVS, threats, and security controls." />
        <meta name="keywords" content="AI security references, AI agents resources, OWASP AISVS references, AI security research, AI threat references, security controls documentation, AI security standards" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/references" />
        <meta property="og:title" content="AI Security References & Resources" />
        <meta property="og:description" content="Comprehensive collection of AI agents security references and resources." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/references" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Security References & Resources" />
        <meta name="twitter:description" content="Comprehensive collection of AI agents security references and resources." />
      </Helmet>

      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">References & Resources</h1>
              <p className="text-xl text-muted-foreground">Comprehensive AI Security Resource Library</p>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
            This page aggregates all external references from our AI security framework, including research papers, 
            standards documents, tools, and resources related to threats, mitigations, and AISVS requirements.
          </p>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total References</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500 mb-1">{stats.threatRefs}</div>
                <div className="text-sm text-muted-foreground">Threat References</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500 mb-1">{stats.mitigationRefs}</div>
                <div className="text-sm text-muted-foreground">Control References</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500 mb-1">{stats.aisvsRefs}</div>
                <div className="text-sm text-muted-foreground">AISVS References</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">{stats.uniqueDomains}</div>
                <div className="text-sm text-muted-foreground">Unique Sources</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search references by title or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedType("all")}
                  className="whitespace-nowrap"
                >
                  All ({allReferences.length})
                </Button>
                <Button
                  variant={selectedType === "threat" ? "default" : "outline"}
                  onClick={() => setSelectedType("threat")}
                  className="whitespace-nowrap"
                >
                  Threats ({stats.threatRefs})
                </Button>
                <Button
                  variant={selectedType === "mitigation" ? "default" : "outline"}
                  onClick={() => setSelectedType("mitigation")}
                  className="whitespace-nowrap"
                >
                  Controls ({stats.mitigationRefs})
                </Button>
                <Button
                  variant={selectedType === "aisvs" ? "default" : "outline"}
                  onClick={() => setSelectedType("aisvs")}
                  className="whitespace-nowrap"
                >
                  AISVS ({stats.aisvsRefs})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* References Display */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grouped">Grouped by Source</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredReferences.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No references found matching your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredReferences.map((ref, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSourceIcon(ref.sourceType)}
                            <h3 className="font-semibold text-lg">{ref.title}</h3>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            Referenced by: {ref.sourceName}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={getSourceBadgeColor(ref.sourceType)}>
                              {ref.sourceType.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{ref.source}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="shrink-0"
                        >
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Visit
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grouped" className="space-y-6">
            {Object.keys(groupedByDomain).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No references found matching your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedByDomain).map(([domain, refs]) => (
                <Card key={domain}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      {domain} ({refs.length} references)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {refs.map((ref, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getSourceIcon(ref.sourceType)}
                              <span className="font-medium">{ref.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>From: {ref.sourceName}</span>
                              <Badge className={getSourceBadgeColor(ref.sourceType)} variant="outline">
                                {ref.sourceType}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </>
  );
};

export default References; 