import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { aisvsData } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";
import { Search, Shield, AlertTriangle, CheckCircle, ExternalLink, Target, Database, Lock, Eye, Users, Cog, FileText, Activity } from "lucide-react";

export const AISVS = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const [checkedRequirements, setCheckedRequirements] = useState<Set<string>>(new Set());

  // Convert AISVS data to array for easier processing
  const categories = Object.values(aisvsData);

  // Filter categories based on search and filters
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      const matchesSearch = searchTerm === "" || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.subCategories.some(subCat => 
          subCat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subCat.requirements.some(req => 
            req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      
      const matchesCategory = selectedCategory === "all" || category.id === selectedCategory;
      
      // Check if category has any requirements matching the level filter
      const hasMatchingLevel = selectedLevel === "all" || 
        category.subCategories.some(subCat => 
          subCat.requirements.some(req => req.level.toString() === selectedLevel)
        );
      
      return matchesSearch && matchesCategory && hasMatchingLevel;
    });
  }, [categories, searchTerm, selectedCategory, selectedLevel]);



  // Toggle requirement check
  const toggleRequirement = (requirementId: string) => {
    const newChecked = new Set(checkedRequirements);
    if (newChecked.has(requirementId)) {
      newChecked.delete(requirementId);
    } else {
      newChecked.add(requirementId);
    }
    setCheckedRequirements(newChecked);
  };

  // Calculate progress
  const totalRequirements = categories.reduce((total, category) => {
    return total + category.subCategories.reduce((catTotal, subCat) => 
      catTotal + subCat.requirements.length, 0);
  }, 0);

  const completedRequirements = checkedRequirements.size;
  const progressPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;

  // Get level badge color
  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800 border-green-200";
      case 2: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 3: return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <Helmet>
        <title>OWASP AISVS - AI Security Verification Standard | Agentic Security Hub</title>
        <meta name="description" content="Interactive OWASP AI Security Verification Standard (AISVS) with comprehensive controls mapped to security threats. Verify AI system security across 13 categories with detailed subcategories and requirements." />
        <meta name="keywords" content="OWASP AISVS, AI security verification, AI security controls, machine learning security, AI governance, security requirements, training data governance, user input validation, model lifecycle management" />
        <link rel="canonical" href="https://agenticsecurity.info/#/aisvs" />
        
        {/* Open Graph */}
        <meta property="og:title" content="OWASP AISVS - AI Security Verification Standard" />
        <meta property="og:description" content="Interactive OWASP AI Security Verification Standard with comprehensive controls mapped to security threats." />
        <meta property="og:url" content="https://agenticsecurity.info/#/aisvs" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="OWASP AISVS - AI Security Verification Standard" />
        <meta name="twitter:description" content="Interactive OWASP AI Security Verification Standard with comprehensive controls mapped to security threats." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": "OWASP AISVS - AI Security Verification Standard",
            "description": "Interactive OWASP AI Security Verification Standard with comprehensive controls mapped to security threats.",
            "url": "https://agenticsecurity.info/#/aisvs",
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "about": {
              "@type": "Thing",
              "name": "AI Security Verification"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <SidebarNav 
          type="controls" 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">OWASP AISVS</h1>
                <p className="text-xl text-muted-foreground">AI Security Verification Standard</p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
              The OWASP AI Security Verification Standard (AISVS) provides a comprehensive framework for 
              verifying the security of AI systems. This interactive tool maps AISVS controls to identified 
              security threats and allows you to track your compliance progress across all categories and subcategories.
            </p>

            {/* Progress Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Implementation Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={progressPercentage} className="flex-1" />
                  <div className="text-sm font-medium">
                    {completedRequirements}/{totalRequirements} ({Math.round(progressPercentage)}%)
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Track your progress implementing AISVS requirements across all categories and subcategories.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Controls and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories, subcategories, requirements, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.code} - {category.name.split(' &')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-[150px]">
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

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Use the filters above to narrow down requirements by category and level
              </div>
            </div>
          </div>

          {/* AISVS Categories */}
          <div className="space-y-6">
            {filteredCategories.map((category) => {
              const categoryProgress = category.subCategories.reduce((total, subCat) => {
                return total + subCat.requirements.filter(req => checkedRequirements.has(req.id)).length;
              }, 0);
              const categoryTotal = category.subCategories.reduce((total, subCat) => total + subCat.requirements.length, 0);
              const categoryPercentage = categoryTotal > 0 ? (categoryProgress / categoryTotal) * 100 : 0;

              return (
                <Card key={category.id} className="overflow-hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={category.id}>
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-start gap-3">
                            <Icon name={category.icon} color={category.color} size={24} />
                            <div className="flex-1 text-left">
                              <CardTitle className="text-xl mb-2">
                                {category.code}: {category.name}
                              </CardTitle>
                              <p className="text-sm opacity-90">
                                {category.description}
                              </p>
                              
                              {/* Progress for this category */}
                              <div className="mt-3 flex items-center gap-2">
                                <Progress value={categoryPercentage} className="flex-1 h-2" />
                                <span className="text-xs font-medium">
                                  {categoryProgress}/{categoryTotal}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <Accordion type="multiple" className="w-full">
                          {category.subCategories.map((subCategory) => (
                            <AccordionItem key={subCategory.id} value={subCategory.id}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 text-left">
                                  <Badge variant="outline" className="text-xs">
                                    {subCategory.code}
                                  </Badge>
                                  <div>
                                    <div className="font-medium">{subCategory.name}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {subCategory.requirements.length} requirement{subCategory.requirements.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-3">
                                  {subCategory.requirements
                                    .filter(req => selectedLevel === "all" || req.level.toString() === selectedLevel)
                                    .map((requirement) => {
                                    const isChecked = checkedRequirements.has(requirement.id);
                                    
                                    return (
                                      <div key={requirement.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <Checkbox
                                          id={requirement.id}
                                          checked={isChecked}
                                          onCheckedChange={() => toggleRequirement(requirement.id)}
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Badge className={`text-xs ${getLevelBadgeColor(requirement.level)}`}>
                                              Level {requirement.level}
                                            </Badge>
                                            {requirement.role && (
                                              <Badge variant="outline" className="text-xs">
                                                {requirement.role}
                                              </Badge>
                                            )}
                                          </div>
                                          <label
                                            htmlFor={requirement.id}
                                            className={`block cursor-pointer ${
                                              isChecked ? 'line-through text-muted-foreground' : ''
                                            }`}
                                          >
                                            <div className="font-medium text-sm mb-1">
                                              {requirement.code}: {requirement.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {requirement.description}
                                            </div>
                                          </label>
                                          {isChecked && (
                                            <CheckCircle className="h-4 w-4 text-green-600 float-right" />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              );
            })}
          </div>

          {/* Summary Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AISVS Implementation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {categories.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Security Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {categories.reduce((total, cat) => total + cat.subCategories.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Subcategories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {totalRequirements}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Requirements</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {completedRequirements}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  The OWASP AISVS provides a structured approach to AI security verification with comprehensive 
                  subcategories and detailed requirements at multiple maturity levels. Use this interactive tool 
                  to track your implementation progress and ensure comprehensive coverage of AI security requirements. 
                  Each category addresses specific security threats identified in our threat model.
                </p>
              </div>

              {/* References Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Key References</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link
                    to="https://github.com/OWASP/AISVS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">OWASP AISVS GitHub Repository</span>
                  </Link>
                  <Link
                    to="https://www.nist.gov/itl/ai-risk-management-framework"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">NIST AI Risk Management Framework</span>
                  </Link>
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

export default AISVS; 