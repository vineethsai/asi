import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { mitigationsData, Mitigation, threatsData, aisvsData } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";
import { Search, Filter, Shield, Target, AlertTriangle, CheckCircle, ExternalLink, Book, BookOpen, Database, Key, Server, Truck, Cpu, Bot, ShieldCheck, Lock, Eye, UserCheck, Monitor, Zap } from 'lucide-react';

// AISVS icon mapping
const aisvsIconMap = {
  "database": Database,
  "shield": Shield,
  "cycle": Zap,
  "server": Server,
  "key": Key,
  "truck": Truck,
  "safety": ShieldCheck,
  "memory": Cpu,
  "robot": Bot,
  "shield-check": ShieldCheck,
  "privacy": Lock,
  "monitor": Monitor,
  "user-check": UserCheck
};

export const Controls = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const controls: Mitigation[] = Object.values(mitigationsData);
  const aisvsCategories = Object.values(aisvsData);
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedThreat, setSelectedThreat] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("mitigations");

  // Get all unique values for filters
  const allTags = Array.from(new Set(controls.flatMap(c => c.tags || [])));
  const allStatuses = Array.from(new Set(controls.map(c => c.status).filter(Boolean)));
  const allThreats = Object.values(threatsData);

  // Handle URL hash-based navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const validTabs = ['mitigations', 'security-controls', 'aisvs', 'aisvs-requirements', 'integration', 'integration-matrix'];
    
    if (hash && validTabs.includes(hash)) {
      // Map hash aliases to actual tab values
      const tabMapping: { [key: string]: string } = {
        'security-controls': 'mitigations',
        'aisvs-requirements': 'aisvs',
        'integration-matrix': 'integration'
      };
      
      const mappedTab = tabMapping[hash] || hash;
      if (['mitigations', 'aisvs', 'integration'].includes(mappedTab)) {
        setActiveTab(mappedTab);
      }
    } else if (!hash) {
      setActiveTab('mitigations');
    }
  }, [location.hash]);

  // Handle tab changes and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Map tab values to hash aliases for better URLs
    const hashMapping: { [key: string]: string } = {
      'mitigations': 'security-controls',
      'aisvs': 'aisvs-requirements',
      'integration': 'integration-matrix'
    };
    
    const hash = hashMapping[value] || value;
    navigate(`${location.pathname}#${hash}`, { replace: true });
  };

  // Filter controls based on search and filters
  const filteredControls = useMemo(() => {
    return controls.filter(control => {
      const matchesSearch = searchTerm === "" || 
        control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (control.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesThreat = selectedThreat === "all" || 
        control.threatIds.includes(selectedThreat);

      return matchesSearch && matchesThreat;
    });
  }, [controls, searchTerm, selectedThreat]);

  // Filter AISVS requirements based on search and filters
  const filteredAISVSRequirements = useMemo(() => {
    const allRequirements = aisvsCategories.flatMap(category => 
      category.subCategories?.flatMap(subCat => 
        subCat.requirements.map(req => ({ 
          ...req, 
          categoryId: category.id,
          categoryName: category.name, 
          categoryColor: category.color,
          subCategoryName: subCat.name 
        }))
      ) || []
    );

    return allRequirements.filter(requirement => {
      const matchesSearch = searchTerm === "" ||
        requirement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requirement.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || requirement.categoryId === selectedCategory;
      
      const matchesLevel = selectedLevel === "all" || requirement.level.toString() === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [aisvsCategories, searchTerm, selectedCategory, selectedLevel]);

  // Analytics for dashboard
  const analytics = useMemo(() => {
    const totalControls = controls.length;
    const totalAISVSRequirements = aisvsCategories.reduce((sum, cat) => 
      sum + (cat.subCategories?.reduce((subSum, subCat) => subSum + subCat.requirements.length, 0) || 0), 0
    );
    const averageRiskScore = controls.reduce((sum, c) => sum + (c.riskScore || 0), 0) / totalControls;
    
    const statusDistribution = controls.reduce((acc, control) => {
      const status = control.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalControls,
      totalAISVSRequirements,
      averageRiskScore: averageRiskScore.toFixed(1),
      statusDistribution
    };
  }, [controls, aisvsCategories]);

  return (
    <>
      <Helmet>
        <title>Controls & Mitigations with AISVS Integration | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="Comprehensive security controls and mitigations for agentic AI systems, integrated with OWASP AISVS (AI Security Verification Standard) requirements and best practices." />
        <meta name="keywords" content="AI security, OWASP AISVS, security controls, mitigations, agentic systems, LLM security, agent security, AI verification, security requirements" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/controls" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/controls" />
        <meta property="og:title" content="AI Security Controls & AISVS Integration | OWASP Guide" />
        <meta property="og:description" content="Explore comprehensive security controls and OWASP AISVS requirements for protecting agentic AI systems and applications." />
        <meta property="og:image" content="https://agenticsecurity.info/og-controls.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://agenticsecurity.info/controls" />
        <meta property="twitter:title" content="AI Security Controls & AISVS Integration | OWASP Guide" />
        <meta property="twitter:description" content="Explore comprehensive security controls and OWASP AISVS requirements for protecting agentic AI systems and applications." />
        <meta property="twitter:image" content="https://agenticsecurity.info/og-controls.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "AI Security Controls & AISVS Integration",
            "description": "Comprehensive security controls and OWASP AISVS requirements for agentic AI systems",
            "url": "https://agenticsecurity.info/controls",
            "isPartOf": {
              "@type": "WebSite",
              "name": "OWASP Securing Agentic Applications Guide",
              "url": "https://agenticsecurity.info"
            },
            "about": [
              {
                "@type": "Thing",
                "name": "AI Security",
                "description": "Security practices for artificial intelligence systems"
              },
              {
                "@type": "Thing", 
                "name": "OWASP AISVS",
                "description": "AI Security Verification Standard"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <Header />
      <SidebarNav type="controls" isOpen={false} onClose={() => {}} />
      
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-4xl">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Security Controls & AISVS Integration
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Comprehensive security controls and mitigations integrated with OWASP AI Security Verification Standard (AISVS) requirements for protecting agentic AI systems
                </p>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Controls</p>
                      <p className="text-2xl font-bold">{analytics.totalControls}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">AISVS Requirements</p>
                      <p className="text-2xl font-bold">{analytics.totalAISVSRequirements}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Categories</p>
                      <p className="text-2xl font-bold">{aisvsCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Active Controls</p>
                      <p className="text-2xl font-bold">{analytics.statusDistribution.active || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search controls, requirements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AISVS Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {aisvsCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Threat Focus</label>
                    <Select value={selectedThreat} onValueChange={setSelectedThreat}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Threats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Threats</SelectItem>
                        {allThreats.map(threat => (
                          <SelectItem key={threat.id} value={threat.id}>
                            {threat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AISVS Level</label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="1">Level 1</SelectItem>
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Link 
                    to="/controls#security-controls" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('mitigations')}
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Security Controls</span>
                  </Link>
                  <Link 
                    to="/controls#aisvs-requirements" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('aisvs')}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">AISVS Requirements</span>
                  </Link>
                  <Link 
                    to="/controls#integration-matrix" 
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange('integration')}
                  >
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Integration Matrix</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mitigations">Security Controls ({filteredControls.length})</TabsTrigger>
                <TabsTrigger value="aisvs">AISVS Requirements ({filteredAISVSRequirements.length})</TabsTrigger>
                <TabsTrigger value="integration">Integration Matrix</TabsTrigger>
              </TabsList>

              {/* Security Controls Tab */}
              <TabsContent value="mitigations" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredControls.map((control) => (
                    <Link to={`/controls/${control.id}`} key={control.id}>
                      <Card className="h-full border border-control/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-3 gap-2">
                            {control.icon && <Icon name={control.icon} color={control.color} size={28} />}
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-foreground" style={{ color: control.color }}>
                                {control.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {control.status && (
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {control.status}
                                  </Badge>
                                )}
                                {control.riskScore && (
                                  <Badge variant="destructive" className="text-xs">
                                    Risk: {control.riskScore}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                            {control.description}
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(control.tags || []).slice(0, 4).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(control.tags || []).length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(control.tags || []).length - 4}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Threat Mappings */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Mitigates Threats:</p>
                            <div className="flex flex-wrap gap-1">
                              {control.threatIds.slice(0, 3).map(threatId => {
                                const threat = threatsData[threatId];
                                return threat ? (
                                  <Badge key={threatId} variant="outline" className="text-xs">
                                    {threat.name}
                                  </Badge>
                                ) : null;
                              })}
                              {control.threatIds.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{control.threatIds.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* AISVS Integration */}
                          {control.tags?.some(tag => tag.startsWith('aisvs-')) && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">AISVS Integration:</p>
                              <div className="flex flex-wrap gap-1">
                                {control.tags.filter(tag => tag.startsWith('aisvs-')).map(tag => (
                                  <Badge key={tag} variant="default" className="text-xs bg-blue-100 text-blue-800">
                                    {tag.replace('aisvs-', '').toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* References */}
                          {control.references && control.references.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-1">References:</p>
                              <div className="flex flex-wrap gap-2">
                                {control.references.slice(0, 2).map(ref => (
                                  <a
                                    key={ref.url}
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:text-primary/80 underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {ref.title.length > 20 ? `${ref.title.substring(0, 20)}...` : ref.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                                {control.references.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{control.references.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              {/* AISVS Requirements Tab */}
              <TabsContent value="aisvs" className="mt-6">
                <Accordion type="single" collapsible className="w-full">
                  {aisvsCategories.map((category) => {
                    const categoryRequirements = category.subCategories?.flatMap(subCat => 
                      subCat.requirements.filter(req => {
                        const matchesSearch = searchTerm === "" ||
                          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.description.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesLevel = selectedLevel === "all" || req.level.toString() === selectedLevel;
                        const matchesThreat = selectedThreat === "all"; // Disable threat filtering for AISVS requirements
                        return matchesSearch && matchesLevel && matchesThreat;
                      })
                    );

                    if (categoryRequirements.length === 0) return null;

                    const IconComponent = aisvsIconMap[category.icon] || Shield;

                    return (
                      <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <IconComponent className="h-6 w-6" style={{ color: category.color }} />
                            <div>
                              <h3 className="text-lg font-semibold" style={{ color: category.color }}>
                                {category.code}: {category.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {category.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {categoryRequirements.length} requirements
                                </Badge>
                                {/* Threat mappings removed - not available in new AISVS structure */}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {categoryRequirements.map((requirement) => (
                              <Card key={requirement.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground">
                                        {requirement.code}: {requirement.title}
                                      </h4>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        Level {requirement.level}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="text-muted-foreground mb-3">
                                    {requirement.description}
                                  </p>
                                  
                                  {/* Threat and Mitigation Mappings - Not available in current AISVS structure */}
                                  
                                  {/* References */}
                                  {requirement.references.length > 0 && (
                                    <div className="pt-2 border-t">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">References:</p>
                                      <div className="space-y-1">
                                        {requirement.references.map(ref => (
                                          <a
                                            key={ref.url}
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:text-primary/80 underline flex items-center gap-1"
                                          >
                                            {ref.title}
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Category References */}
                          {category.references.length > 0 && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                              <h4 className="font-semibold mb-2">Category References:</h4>
                              <div className="space-y-1">
                                {category.references.map(ref => (
                                  <a
                                    key={ref.url}
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:text-primary/80 underline flex items-center gap-1"
                                  >
                                    {ref.title}
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </TabsContent>

              {/* Integration Matrix Tab */}
              <TabsContent value="integration" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      AISVS-Controls Integration Matrix
                    </CardTitle>
                    <CardDescription>
                      High-level mapping between AISVS categories, security controls, and threat coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {aisvsCategories.map((category) => {
                        const IconComponent = aisvsIconMap[category.icon] || Shield;
                        
                        // Find controls that are conceptually related to this AISVS category
                        const relatedControls = controls.filter(control => {
                          // Check for direct AISVS tags
                          const hasAISVSTag = control.tags?.some(tag => 
                            tag.toLowerCase().includes(category.code.toLowerCase()) ||
                            tag.toLowerCase().includes('aisvs')
                          );
                          
                          // Check for conceptual relationships based on category focus
                          const conceptualMatch = (() => {
                            const categoryName = category.name.toLowerCase();
                            const controlName = control.name.toLowerCase();
                            const controlDesc = control.description.toLowerCase();
                            const controlTags = (control.tags || []).join(' ').toLowerCase();
                            
                            // Training Data Governance
                            if (category.code === 'C1') {
                              return controlName.includes('memory') || controlName.includes('validation') ||
                                     controlDesc.includes('data') || controlTags.includes('memory') ||
                                     controlTags.includes('validation') || controlTags.includes('sanitization');
                            }
                            // User Input Validation
                            else if (category.code === 'C2') {
                              return controlName.includes('prompt') || controlName.includes('input') ||
                                     controlName.includes('jailbreak') || controlTags.includes('prompt') ||
                                     controlTags.includes('input') || controlTags.includes('validation');
                            }
                            // Model Lifecycle Management
                            else if (category.code === 'C3') {
                              return controlName.includes('reasoning') || controlName.includes('validation') ||
                                     controlTags.includes('reasoning') || controlTags.includes('lifecycle');
                            }
                            // Infrastructure & Configuration
                            else if (category.code === 'C4') {
                              return controlName.includes('sandboxing') || controlName.includes('isolation') ||
                                     controlName.includes('runtime') || controlTags.includes('sandbox') ||
                                     controlTags.includes('infrastructure') || controlTags.includes('runtime');
                            }
                            // Access Control & Identity
                            else if (category.code === 'C5') {
                              return controlName.includes('access') || controlName.includes('privilege') ||
                                     controlName.includes('authentication') || controlTags.includes('access') ||
                                     controlTags.includes('privilege') || controlTags.includes('rbac');
                            }
                            // Supply Chain Security
                            else if (category.code === 'C6') {
                              return controlName.includes('supply') || controlName.includes('provenance') ||
                                     controlTags.includes('supply') || controlTags.includes('provenance');
                            }
                            // Model Behavior Control
                            else if (category.code === 'C7') {
                              return controlName.includes('content') || controlName.includes('output') ||
                                     controlName.includes('filtering') || controlTags.includes('content') ||
                                     controlTags.includes('output') || controlTags.includes('filtering');
                            }
                            // Memory & Vector Database Security
                            else if (category.code === 'C8') {
                              return controlName.includes('memory') || controlTags.includes('memory') ||
                                     controlTags.includes('vector') || controlTags.includes('database');
                            }
                            // Autonomous & Agentic Security
                            else if (category.code === 'C9') {
                              return controlName.includes('tool') || controlName.includes('agent') ||
                                     controlTags.includes('tool') || controlTags.includes('agent') ||
                                     controlTags.includes('autonomous');
                            }
                            // Adversarial Robustness
                            else if (category.code === 'C10') {
                              return controlName.includes('adversarial') || controlTags.includes('adversarial') ||
                                     controlTags.includes('robustness') || controlTags.includes('attack');
                            }
                            // Privacy Protection
                            else if (category.code === 'C11') {
                              return controlName.includes('privacy') || controlTags.includes('privacy') ||
                                     controlTags.includes('pii') || controlTags.includes('data-protection');
                            }
                            // Monitoring & Logging
                            else if (category.code === 'C12') {
                              return controlName.includes('monitoring') || controlName.includes('auditing') ||
                                     controlTags.includes('monitoring') || controlTags.includes('audit') ||
                                     controlTags.includes('logging');
                            }
                            // Human Oversight
                            else if (category.code === 'C13') {
                              return controlName.includes('human') || controlName.includes('oversight') ||
                                     controlTags.includes('human') || controlTags.includes('oversight') ||
                                     controlTags.includes('loop');
                            }
                            
                            return false;
                          })();
                          
                          return hasAISVSTag || conceptualMatch;
                        });

                                                 // Get threats that are conceptually relevant to this AISVS category
                         const getRelevantThreats = () => {
                           const allThreats = Object.values(threatsData);
                           return allThreats.filter(threat => {
                             const threatName = threat.name.toLowerCase();
                             const threatDesc = threat.description.toLowerCase();
                             const threatTags = (threat.tags || []).join(' ').toLowerCase();
                             
                             switch (category.code) {
                               case 'C1': // Training Data Governance
                                 return threatName.includes('memory') || threatName.includes('poisoning') ||
                                        threatDesc.includes('data') || threatDesc.includes('memory') ||
                                        threatTags.includes('memory') || threatTags.includes('data') ||
                                        threat.id === 't1' || threat.id === 't5'; // Memory Poisoning, Cascading Hallucination
                               case 'C2': // User Input Validation
                                 return threatName.includes('injection') || threatDesc.includes('prompt') ||
                                        threatDesc.includes('input') || threatTags.includes('prompt') ||
                                        threatTags.includes('injection');
                               case 'C3': // Model Lifecycle Management
                                 return threatName.includes('hallucination') || threatDesc.includes('model') ||
                                        threatTags.includes('reasoning') || threat.id === 't5'; // Cascading Hallucination
                               case 'C4': // Infrastructure & Configuration
                                 return threatName.includes('resource') || threatDesc.includes('infrastructure') ||
                                        threatTags.includes('infrastructure') || threat.id === 't4'; // Resource Overload
                               case 'C5': // Access Control & Identity
                                 return threatName.includes('privilege') || threatName.includes('access') ||
                                        threatDesc.includes('privilege') || threatDesc.includes('access') ||
                                        threatTags.includes('privilege') || threatTags.includes('access') ||
                                        threat.id === 't3'; // Privilege Compromise
                               case 'C6': // Supply Chain Security
                                 return threatDesc.includes('supply') || threatTags.includes('supply');
                               case 'C7': // Model Behavior Control
                                 return threatName.includes('hallucination') || threatDesc.includes('behavior') ||
                                        threatTags.includes('behavior') || threat.id === 't5'; // Cascading Hallucination
                               case 'C8': // Memory & Vector Database Security
                                 return threatName.includes('memory') || threatDesc.includes('memory') ||
                                        threatTags.includes('memory') || threat.id === 't1'; // Memory Poisoning
                               case 'C9': // Autonomous & Agentic Security
                                 return threatName.includes('tool') || threatDesc.includes('tool') ||
                                        threatTags.includes('tool') || threat.id === 't2'; // Tool Misuse
                               case 'C10': // Adversarial Robustness
                                 return threatDesc.includes('adversarial') || threatTags.includes('adversarial');
                               case 'C11': // Privacy Protection
                                 return threatDesc.includes('privacy') || threatTags.includes('privacy') ||
                                        threatDesc.includes('data') || threat.id === 't1' || threat.id === 't3';
                               case 'C12': // Monitoring & Logging
                                 return threatDesc.includes('monitoring') || threatTags.includes('monitoring');
                               case 'C13': // Human Oversight
                                 return threatDesc.includes('human') || threatTags.includes('human');
                               default:
                                 return false;
                             }
                           });
                         };
                         
                         const relevantThreats = getRelevantThreats();

                        const totalRequirements = category.subCategories?.reduce((sum, subCat) => sum + subCat.requirements.length, 0) || 0;

                        return (
                          <div key={category.id} className="border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-200" style={{ borderColor: `${category.color}20` }}>
                            {/* Category Header */}
                            <div className="flex items-start gap-4 mb-6">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: `${category.color}15` }}>
                                <IconComponent className="h-8 w-8" style={{ color: category.color }} />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2" style={{ color: category.color }}>
                                  {category.code}: {category.name}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                                  {category.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {totalRequirements} AISVS Requirements
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {relatedControls.length} Security Controls
                                  </Badge>
                                                                     <Badge variant="outline" className="text-xs">
                                     {relevantThreats.length} Threats Addressed
                                   </Badge>
                                </div>
                              </div>
                            </div>

                                                         {/* Two-column layout */}
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Security Controls */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Security Controls
                                </h4>
                                <div className="space-y-2">
                                  {relatedControls.length > 0 ? (
                                    relatedControls.slice(0, 4).map(control => (
                                      <Link key={control.id} to={`/controls/${control.id}`}>
                                        <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/20">
                                          <div className="font-medium text-sm mb-1">{control.name}</div>
                                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>Risk: {control.riskScore || 'N/A'}</span>
                                            <span>•</span>
                                            <span>{control.threatIds.length} threats</span>
                                          </div>
                                        </div>
                                      </Link>
                                    ))
                                  ) : (
                                    <div className="p-3 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
                                      <div className="text-sm text-muted-foreground italic text-center">
                                        No direct control mappings identified
                                      </div>
                                      <div className="text-xs text-muted-foreground text-center mt-1">
                                        Consider implementing controls for this category
                                      </div>
                                    </div>
                                  )}
                                  {relatedControls.length > 4 && (
                                    <div className="text-xs text-muted-foreground text-center py-2">
                                      +{relatedControls.length - 4} more controls
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Threat Coverage */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Threat Coverage
                                </h4>
                                                                 <div className="space-y-2">
                                   {relevantThreats.length > 0 ? (
                                     relevantThreats.map(threat => (
                                       <Link key={threat.id} to={`/threats/${threat.id}`}>
                                         <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/20">
                                           <div className="font-medium text-sm mb-1">{threat.name}</div>
                                           <div className="text-xs text-muted-foreground flex items-center gap-2">
                                             <Badge variant={threat.impactLevel === 'high' ? 'destructive' : threat.impactLevel === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                               {threat.impactLevel} impact
                                             </Badge>
                                           </div>
                                         </div>
                                       </Link>
                                     ))
                                   ) : (
                                     <div className="p-3 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
                                       <div className="text-sm text-muted-foreground italic text-center">
                                         No specific threats mapped
                                       </div>
                                       <div className="text-xs text-muted-foreground text-center mt-1">
                                         Review threat model for this category
                                       </div>
                                     </div>
                                   )}
                                 </div>
                              </div>

                              
                            </div>

                            {/* Coverage Summary */}
                            <div className="mt-6 pt-4 border-t border-muted-foreground/10">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Coverage Summary:</span>
                                <div className="flex items-center gap-4">
                                  <span className={`font-medium ${relatedControls.length > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {relatedControls.length > 0 ? '✓ Controls Mapped' : '⚠ Needs Controls'}
                                  </span>
                                                                     <span className={`font-medium ${relevantThreats.length > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                     {relevantThreats.length > 0 ? '✓ Threats Covered' : '⚠ Review Threats'}
                                   </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Statistics */}
                    <div className="mt-8 p-6 bg-muted/30 rounded-xl">
                      <h3 className="text-lg font-semibold mb-4">Integration Matrix Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {aisvsCategories.length}
                          </div>
                          <div className="text-sm text-muted-foreground">AISVS Categories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {controls.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Security Controls</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {Object.keys(threatsData).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Threat Categories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {Math.round((aisvsCategories.filter(cat => 
                              controls.some(ctrl => 
                                ctrl.tags?.some(tag => tag.toLowerCase().includes(cat.code.toLowerCase()))
                              )
                            ).length / aisvsCategories.length) * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Coverage Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </>
  );
};

export default Controls; 