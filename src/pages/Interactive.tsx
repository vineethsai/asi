import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThreatModeler } from '@/components/interactive/ThreatModeler';
import { SecurityQuiz } from '@/components/interactive/SecurityQuiz';
import { SecurityChecklist } from '@/components/interactive/SecurityChecklist';
import { ThreatModelDiagram } from '@/components/visual/ThreatModelDiagram';
import { 
  Brain, 
  Shield, 
  CheckSquare, 
  Target, 
  Zap, 
  BookOpen, 
  Users, 
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Play
} from 'lucide-react';

const interactiveTools = [
  {
    id: 'threat-modeler',
    title: 'Threat Modeler',
    description: 'Analyze your AI system components and get customized threat assessments',
    icon: <Target className="h-6 w-6" />,
    color: 'blue',
    features: ['Component Selection', 'Risk Analysis', 'AISVS Mapping', 'Control Recommendations'],
    estimatedTime: '15-30 minutes',
    difficulty: 'Intermediate'
  },
  {
    id: 'security-quiz',
    title: 'Security Knowledge Quiz',
    description: 'Test your AI security knowledge with interactive questions',
    icon: <Brain className="h-6 w-6" />,
    color: 'green',
    features: ['Multiple Difficulty Levels', 'Detailed Explanations', 'AISVS References', 'Progress Tracking'],
    estimatedTime: '10-20 minutes',
    difficulty: 'All Levels'
  },
  {
    id: 'security-checklist',
    title: 'Implementation Checklist',
    description: 'Step-by-step security implementation guide with progress tracking',
    icon: <CheckSquare className="h-6 w-6" />,
    color: 'purple',
    features: ['Implementation Guides', 'Code Examples', 'Progress Tracking', 'Export Reports'],
    estimatedTime: 'Ongoing',
    difficulty: 'Beginner to Advanced'
  },
  {
    id: 'threat-diagram',
    title: 'Visual Threat Model',
    description: 'Interactive diagrams showing attack vectors and system architecture',
    icon: <Shield className="h-6 w-6" />,
    color: 'orange',
    features: ['Interactive Diagrams', 'Attack Path Visualization', 'Component Highlighting', 'Control Mapping'],
    estimatedTime: '5-10 minutes',
    difficulty: 'All Levels'
  }
];

const usageStats = [
  { label: 'Security Assessments Completed', value: '2,847', icon: <Target className="h-5 w-5" /> },
  { label: 'Quiz Questions Answered', value: '18,329', icon: <Brain className="h-5 w-5" /> },
  { label: 'Checklist Items Completed', value: '5,672', icon: <CheckSquare className="h-5 w-5" /> },
  { label: 'Threat Models Created', value: '1,234', icon: <Shield className="h-5 w-5" /> }
];

export default function Interactive() {
  const [activeTab, setActiveTab] = useState('overview');

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <Zap className="h-4 w-4" />
          Interactive Security Guidance
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
          Hands-On AI Security
          <span className="block text-primary">Learning Platform</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Master AI security with interactive tools designed to help you assess, implement, and maintain 
          robust security controls for your agentic AI systems based on OWASP AISVS standards.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="btn-primary"
            onClick={() => setActiveTab('threat-modeler')}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Threat Assessment
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setActiveTab('security-quiz')}
          >
            <Brain className="h-5 w-5 mr-2" />
            Test Your Knowledge
          </Button>
        </div>
      </div>

      {/* Usage Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {usageStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threat-modeler">Threat Modeler</TabsTrigger>
          <TabsTrigger value="security-quiz">Security Quiz</TabsTrigger>
          <TabsTrigger value="security-checklist">Checklist</TabsTrigger>
          <TabsTrigger value="threat-diagram">Visual Model</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>New to AI Security?</strong> Start with the Security Quiz to assess your knowledge, 
              then use the Threat Modeler to analyze your system, and follow the Implementation Checklist 
              to apply security controls systematically.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {interactiveTools.map((tool) => (
              <Card key={tool.id} className="interactive-card group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${getColorClasses(tool.color)}`}>
                        {tool.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{tool.title}</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tool.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>⏱️ {tool.estimatedTime}</span>
                    <span>📊 {tool.difficulty}</span>
                  </div>
                  
                  <Button 
                    className="w-full btn-primary group-hover:shadow-md transition-shadow"
                    onClick={() => setActiveTab(tool.id)}
                  >
                    Launch Tool
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Learning Path */}
          <Card className="success-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recommended Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Assess Knowledge</h4>
                  <p className="text-sm text-muted-foreground">
                    Take the Security Quiz to understand your current knowledge level
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Model Threats</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the Threat Modeler to analyze your specific system components
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Implement Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Follow the Implementation Checklist to apply security measures
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Visualize & Monitor</h4>
                  <p className="text-sm text-muted-foreground">
                    Use Visual Threat Models to understand attack vectors and maintain security
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="security-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Common Threats</span>
                    <Badge variant="outline">Prompt Injection (78%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top Implementation Priority</span>
                    <Badge variant="outline">Input Validation (92%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Security Score</span>
                    <Badge variant="outline">73/100</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="security-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tools Completed</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30">0/4</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Knowledge Level</span>
                    <Badge variant="outline">Not Assessed</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Score</span>
                    <Badge variant="outline">Not Calculated</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tool Tabs */}
        <TabsContent value="threat-modeler">
          <ThreatModeler />
        </TabsContent>

        <TabsContent value="security-quiz">
          <SecurityQuiz />
        </TabsContent>

        <TabsContent value="security-checklist">
          <SecurityChecklist />
        </TabsContent>

        <TabsContent value="threat-diagram">
          <ThreatModelDiagram />
        </TabsContent>
      </Tabs>
    </div>
  );
} 