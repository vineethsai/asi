import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import ATLAS data from JSON files
import atlasTechniquesData from "../components/components/atlas_techniques.json";
import atlasTacticsData from "../components/components/atlas_tactics.json";
import atlasCaseStudiesData from "../components/components/atlas_case_studies.json";
import { threatsData, aisvsData, mitigationsData } from "../components/components/securityData";

// Transform imported data to match expected interface
const atlasTactics = (atlasTacticsData as any[]).reduce((acc: any, tactic: any) => {
  acc[tactic.id] = tactic;
  return acc;
}, {});

const atlasTechniques = (atlasTechniquesData as any[]).reduce((acc: any, technique: any) => {
  acc[technique.id] = technique;
  return acc;
}, {});

const atlasCaseStudies = (atlasCaseStudiesData as any[]).reduce((acc: any, caseStudy: any) => {
  acc[caseStudy.id] = caseStudy;
  return acc;
}, {});

// Helper functions
const getATLASTechniquesForThreat = (threatId: string) => {
  return (atlasTechniquesData as any[]).filter((technique: any) => 
    technique.threatMapping && technique.threatMapping.includes(threatId)
  );
};

const getATLASTechniquesForAISVS = (aisvsCode: string) => {
  return (atlasTechniquesData as any[]).filter((technique: any) => 
    technique.aisvsMapping && technique.aisvsMapping.includes(aisvsCode)
  );
};

const getThreatMappingStats = () => {
  const totalTechniques = (atlasTechniquesData as any[]).length;
  const mappedTechniques = (atlasTechniquesData as any[]).filter((t: any) => 
    t.threatMapping && t.threatMapping.length > 0
  ).length;
  
  return {
    totalTechniques,
    mappedTechniques,
    coveragePercentage: Math.round((mappedTechniques / totalTechniques) * 100)
  };
};

// Type definitions
interface ATLASTactic {
  id: string;
  code: string;
  name: string;
  description: string;
  techniques: string[];
  color?: string;
  icon?: string;
  displayOrder: number;
}

interface ATLASTechnique {
  id: string;
  code: string;
  name: string;
  description: string;
  tactic: string;
  subtechniques?: any[];
  mitigations?: string[];
  aisvsMapping?: string[];
  threatMapping?: string[];
  references?: any[];
  examples?: any[];
  platforms?: string[];
  dataSource?: string[];
  detection?: string;
  version?: string;
  created?: string;
  lastModified?: string;
}

interface ATLASCaseStudy {
  id: string;
  name: string;
  description: string;
  summary: string;
  targetSystem: string;
  attackVector: string;
  techniques: string[];
  impact: {
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
  };
  timeline: string;
  references: any[];
  lessons: string[];
  mitigations: string[];
  aisvsMapping?: string[];
  threatMapping?: string[];
}
import SidebarNav from "../components/layout/SidebarNav";
import { Helmet } from "react-helmet";
import { 
  Search, 
  Shield, 
  Target, 
  ExternalLink, 
  GitBranch, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Network, 
  Layers,
  Eye,
  Brain,
  Lock,
  Zap
} from "lucide-react";
import { Icon } from "@/components/ui/icon";

export const MitreAtlas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState("matrix");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTactic, setSelectedTactic] = useState<string>("all");
  const [selectedTechnique, setSelectedTechnique] = useState<ATLASTechnique | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data processing
  // @ts-ignore - JSON import typing issue
  const tactics = Object.values(atlasTactics).sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  // @ts-ignore - JSON import typing issue
  const techniques = Object.values(atlasTechniques);
  // @ts-ignore - JSON import typing issue
  const caseStudies = Object.values(atlasCaseStudies);
  const mappingStats = getThreatMappingStats();

  // Filtering
  const filteredTechniques = useMemo(() => {
    return techniques.filter((technique: any) => {
      const matchesSearch = searchTerm === "" ||
        technique.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        technique.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTactic = selectedTactic === "all" || technique.tactic === selectedTactic;
      
      return matchesSearch && matchesTactic;
    });
  }, [techniques, searchTerm, selectedTactic]);

  // Event handlers
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`${location.pathname}#${value}`, { replace: true });
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleTechniqueSelect = (technique: ATLASTechnique) => {
    setSelectedTechnique(technique);
  };

  const getTacticById = (tacticId: string) => {
    return atlasTactics[tacticId];
  };

  const getThreatById = (threatId: string) => {
    return threatsData[threatId];
  };

  const getAISVSById = (aisvsCode: string) => {
    return Object.values(aisvsData).find(category => category.code === aisvsCode);
  };

  return (
    <>
      <Helmet>
        <title>MITRE ATLAS Framework | AI Security Threat Matrix & Attack Techniques</title>
        <meta name="description" content="Comprehensive MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) framework with interactive threat matrix, attack techniques, case studies, and mappings to AISVS controls." />
        <meta name="keywords" content="MITRE ATLAS, AI security threats, adversarial machine learning, AI attack techniques, ML security framework, AI threat matrix, artificial intelligence security, adversarial AI, ML threat landscape" />
        <link rel="canonical" href="https://agenticsecurity.info/mitre-atlas" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MITRE ATLAS Framework | AI Security Threat Matrix" />
        <meta property="og:description" content="Interactive MITRE ATLAS framework for understanding AI security threats and attack techniques." />
        <meta property="og:url" content="https://agenticsecurity.info/#/mitre-atlas" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MITRE ATLAS Framework | AI Security Threat Matrix" />
        <meta name="twitter:description" content="Interactive MITRE ATLAS framework for understanding AI security threats and attack techniques." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header 
          onMobileMenuToggle={handleMobileMenuToggle} 
          isMobileMenuOpen={isMobileMenuOpen} 
        />
        
        {/* Mobile Navigation Sidebar */}
        <SidebarNav 
          type="threats" 
          isOpen={isMobileMenuOpen} 
          onClose={handleMobileMenuClose} 
        />

        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">MITRE ATLAS Framework</h1>
                <p className="text-lg text-muted-foreground">Adversarial Threat Landscape for AI Systems</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
              MITRE ATLAS is a comprehensive knowledge base of adversary tactics, techniques, and case studies 
              for artificial intelligence systems. Explore AI-specific attack patterns, real-world case studies, 
              and their mappings to our threat model and AISVS controls.
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Tactics</p>
                      <p className="text-xl font-bold">{tactics.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Techniques</p>
                      <p className="text-xl font-bold">{techniques.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Case Studies</p>
                      <p className="text-xl font-bold">{caseStudies.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Coverage</p>
                      <p className="text-xl font-bold">{mappingStats.coveragePercentage}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="matrix">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Threat Matrix</span>
                  <span className="sm:hidden">Matrix</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="techniques">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Techniques</span>
                  <span className="sm:hidden">Tech</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="case-studies">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Case Studies</span>
                  <span className="sm:hidden">Cases</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="mappings">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Mappings</span>
                  <span className="sm:hidden">Maps</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Threat Matrix Tab */}
            <TabsContent value="matrix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    MITRE ATLAS Threat Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 min-w-max">
                      {(tactics as any[]).map((tactic: any) => (
                        <div key={tactic.id} className="min-w-80">
                          <div 
                            className="p-3 rounded-lg mb-3 text-white font-semibold text-center"
                            style={{ backgroundColor: tactic.color }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Icon name={tactic.icon} size={20} />
                              <span>{tactic.name}</span>
                            </div>
                            <p className="text-xs mt-1 opacity-90">{tactic.code}</p>
                          </div>
                          <div className="space-y-2">
                            {(techniques as any[])
                              .filter((technique: any) => technique.tactic === tactic.id)
                              .map((technique: any) => (
                                <Button
                                  key={technique.id}
                                  variant="outline"
                                  className="w-full text-left justify-start h-auto p-3"
                                  onClick={() => handleTechniqueSelect(technique as ATLASTechnique)}
                                >
                                  <div>
                                    <div className="font-medium text-sm">{technique.name}</div>
                                    <div className="text-xs text-muted-foreground">{technique.code}</div>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Technique Details */}
              {selectedTechnique && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {selectedTechnique.name}
                      <Badge variant="outline">{selectedTechnique.code}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground mb-4">{selectedTechnique.description}</p>
                        
                        <h4 className="font-semibold mb-2">Examples</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {selectedTechnique.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Mapped Threats</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedTechnique.threatMapping.map((threatId) => {
                            const threat = getThreatById(threatId);
                            return threat ? (
                              <Link key={threatId} to={`/threats/${threatId}`}>
                                <Badge variant="default" className="hover:opacity-80">
                                  {threat.code}: {threat.name}
                                </Badge>
                              </Link>
                            ) : null;
                          })}
                        </div>

                        <h4 className="font-semibold mb-2">AISVS Mappings</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedTechnique.aisvsMapping.map((aisvsCode) => {
                            const aisvs = getAISVSById(aisvsCode);
                            return aisvs ? (
                              <Link key={aisvsCode} to="/aisvs">
                                <Badge variant="secondary" className="hover:opacity-80">
                                  {aisvsCode}: {aisvs.name.split(' &')[0]}
                                </Badge>
                              </Link>
                            ) : (
                              <Badge key={aisvsCode} variant="outline">
                                {aisvsCode}
                              </Badge>
                            );
                          })}
                        </div>

                        <h4 className="font-semibold mb-2">Detection</h4>
                        <p className="text-sm text-muted-foreground">{selectedTechnique.detection}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Techniques Tab */}
            <TabsContent value="techniques" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTechniques.map((technique) => {
                  const tactic = getTacticById(technique.tactic);
                  return (
                    <Card key={technique.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{technique.code}</Badge>
                          {tactic && (
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tactic.color }}
                              title={tactic.name}
                            />
                          )}
                        </div>
                        <CardTitle className="text-lg">{technique.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4">
                          {technique.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium">Platforms: </span>
                            <span className="text-xs text-muted-foreground">
                              {technique.platforms.join(", ")}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-xs font-medium">Threats: </span>
                            <span className="text-xs text-muted-foreground">
                              {technique.threatMapping.length} mapped
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-xs font-medium">AISVS: </span>
                            <span className="text-xs text-muted-foreground">
                              {technique.aisvsMapping.length} mapped
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => handleTechniqueSelect(technique)}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Case Studies Tab */}
            <TabsContent value="case-studies" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {caseStudies.map((caseStudy) => (
                  <Card key={caseStudy.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {caseStudy.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{caseStudy.summary}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium">Target System:</span>
                          <p className="text-sm text-muted-foreground">{caseStudy.targetSystem}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Attack Vector:</span>
                          <p className="text-sm text-muted-foreground">{caseStudy.attackVector}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-sm font-medium">Impact:</span>
                        <div className="flex gap-2 mt-1">
                          {caseStudy.impact.confidentiality && (
                            <Badge variant="destructive" className="text-xs">Confidentiality</Badge>
                          )}
                          {caseStudy.impact.integrity && (
                            <Badge variant="destructive" className="text-xs">Integrity</Badge>
                          )}
                          {caseStudy.impact.availability && (
                            <Badge variant="destructive" className="text-xs">Availability</Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-sm font-medium">Timeline:</span>
                        <p className="text-sm text-muted-foreground">{caseStudy.timeline}</p>
                      </div>

                      <div className="mb-4">
                        <span className="text-sm font-medium">Key Lessons:</span>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                          {caseStudy.lessons.map((lesson, index) => (
                            <li key={index}>{lesson}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        {caseStudy.references.map((ref, index) => (
                          <a
                            key={index}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {ref.title}
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Mappings Tab */}
            <TabsContent value="mappings" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Threat Mappings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Threat Mappings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      MITRE ATLAS techniques mapped to our threat model
                    </p>
                    <div className="space-y-4">
                      {Object.values(threatsData).slice(0, 8).map((threat) => {
                        const mappedTechniques = getATLASTechniquesForThreat(threat.id);
                        return (
                          <div key={threat.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{threat.code}</Badge>
                              <Link to={`/threats/${threat.id}`} className="font-medium hover:underline">
                                {threat.name}
                              </Link>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mappedTechniques.map((technique) => (
                                <Badge key={technique.id} variant="secondary" className="text-xs">
                                  {technique.code}
                                </Badge>
                              ))}
                              {mappedTechniques.length === 0 && (
                                <span className="text-xs text-muted-foreground">No mappings</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* AISVS Mappings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      AISVS Mappings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      MITRE ATLAS techniques mapped to AISVS controls
                    </p>
                    <div className="space-y-4">
                      {Object.values(aisvsData).slice(0, 8).map((category) => {
                        const mappedTechniques = getATLASTechniquesForAISVS(category.code);
                        return (
                          <div key={category.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{category.code}</Badge>
                              <Link to="/aisvs" className="font-medium hover:underline">
                                {category.name.split(' &')[0]}
                              </Link>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mappedTechniques.map((technique) => (
                                <Badge key={technique.id} variant="secondary" className="text-xs">
                                  {technique.code}
                                </Badge>
                              ))}
                              {mappedTechniques.length === 0 && (
                                <span className="text-xs text-muted-foreground">No mappings</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* References Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                References & Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">MITRE ATLAS</h4>
                  <div className="space-y-2">
                    <a
                      href="https://atlas.mitre.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Official MITRE ATLAS Website</span>
                    </a>
                    <a
                      href="https://atlas.mitre.org/matrices/ATLAS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>ATLAS Matrix</span>
                    </a>
                    <a
                      href="https://github.com/mitre/advmlthreatmatrix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>ATLAS GitHub Repository</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Related Frameworks</h4>
                  <div className="space-y-2">
                    <Link
                      to="/nist-mapping"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>NIST AI RMF Mapping</span>
                    </Link>
                    <Link
                      to="/aisvs"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>OWASP AISVS Controls</span>
                    </Link>
                    <Link
                      to="/threats"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Agent Threat Model</span>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MitreAtlas; 