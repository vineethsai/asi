import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Database, 
  Network, 
  Cloud, 
  Lock,
  Eye,
  Zap,
  Users,
  Code,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';

// Component types for the threat model
interface SystemComponent {
  id: string;
  name: string;
  description: string;
  category: 'ai-model' | 'data' | 'infrastructure' | 'interface' | 'governance';
  icon: React.ReactNode;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: string[];
  controls: string[];
}

interface ThreatDefinition {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  category: string;
  aisvsMapping: string[];
  mitigations: string[];
}

interface ControlRecommendation {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementationEffort: 'low' | 'medium' | 'high';
  aisvsCategory: string;
  codeExample?: string;
}

const systemComponents: SystemComponent[] = [
  {
    id: 'llm-model',
    name: 'Large Language Model',
    description: 'Core AI model for text generation and understanding',
    category: 'ai-model',
    icon: <Brain className="h-5 w-5" />,
    riskLevel: 'critical',
    threats: ['prompt-injection', 'data-poisoning', 'model-theft', 'adversarial-examples'],
    controls: ['input-validation', 'output-filtering', 'model-monitoring', 'access-controls']
  },
  {
    id: 'training-data',
    name: 'Training Dataset',
    description: 'Data used to train and fine-tune the AI model',
    category: 'data',
    icon: <Database className="h-5 w-5" />,
    riskLevel: 'high',
    threats: ['data-poisoning', 'privacy-leakage', 'bias-injection', 'data-theft'],
    controls: ['data-validation', 'privacy-protection', 'access-controls', 'audit-logging']
  },
  {
    id: 'api-interface',
    name: 'API Interface',
    description: 'External interface for AI model access',
    category: 'interface',
    icon: <Network className="h-5 w-5" />,
    riskLevel: 'high',
    threats: ['prompt-injection', 'dos-attacks', 'unauthorized-access', 'data-exfiltration'],
    controls: ['rate-limiting', 'authentication', 'input-validation', 'monitoring']
  },
  {
    id: 'cloud-infrastructure',
    name: 'Cloud Infrastructure',
    description: 'Hosting and compute infrastructure',
    category: 'infrastructure',
    icon: <Cloud className="h-5 w-5" />,
    riskLevel: 'medium',
    threats: ['infrastructure-attacks', 'data-theft', 'service-disruption', 'misconfigurations'],
    controls: ['security-hardening', 'encryption', 'monitoring', 'backup-recovery']
  },
  {
    id: 'user-interface',
    name: 'User Interface',
    description: 'Frontend application for user interactions',
    category: 'interface',
    icon: <Users className="h-5 w-5" />,
    riskLevel: 'medium',
    threats: ['xss-attacks', 'csrf-attacks', 'social-engineering', 'data-leakage'],
    controls: ['input-sanitization', 'output-encoding', 'session-management', 'user-education']
  },
  {
    id: 'model-storage',
    name: 'Model Storage',
    description: 'Storage system for AI models and weights',
    category: 'data',
    icon: <Lock className="h-5 w-5" />,
    riskLevel: 'high',
    threats: ['model-theft', 'unauthorized-access', 'data-corruption', 'tampering'],
    controls: ['encryption', 'access-controls', 'integrity-checking', 'audit-logging']
  },
  {
    id: 'monitoring-system',
    name: 'Monitoring & Logging',
    description: 'System for monitoring AI behavior and logging',
    category: 'governance',
    icon: <Eye className="h-5 w-5" />,
    riskLevel: 'medium',
    threats: ['log-tampering', 'monitoring-evasion', 'privacy-violations', 'data-leakage'],
    controls: ['secure-logging', 'anomaly-detection', 'access-controls', 'privacy-protection']
  },
  {
    id: 'deployment-pipeline',
    name: 'Deployment Pipeline',
    description: 'CI/CD pipeline for model deployment',
    category: 'infrastructure',
    icon: <Code className="h-5 w-5" />,
    riskLevel: 'high',
    threats: ['supply-chain-attacks', 'unauthorized-deployments', 'code-injection', 'privilege-escalation'],
    controls: ['secure-pipeline', 'code-signing', 'access-controls', 'vulnerability-scanning']
  }
];

const threatDefinitions: Record<string, ThreatDefinition> = {
  'prompt-injection': {
    id: 'prompt-injection',
    name: 'Prompt Injection',
    description: 'Malicious prompts that override system instructions or extract sensitive information',
    severity: 'critical',
    likelihood: 'high',
    category: 'Input Manipulation',
    aisvsMapping: ['C2.1', 'C2.2'],
    mitigations: ['input-validation', 'output-filtering', 'prompt-templates']
  },
  'data-poisoning': {
    id: 'data-poisoning',
    name: 'Data Poisoning',
    description: 'Injection of malicious data to corrupt model training or behavior',
    severity: 'high',
    likelihood: 'medium',
    category: 'Training Data',
    aisvsMapping: ['C1.6', 'C1.9'],
    mitigations: ['data-validation', 'anomaly-detection', 'data-provenance']
  },
  'model-theft': {
    id: 'model-theft',
    name: 'Model Theft',
    description: 'Unauthorized extraction or replication of AI model weights and architecture',
    severity: 'high',
    likelihood: 'medium',
    category: 'Intellectual Property',
    aisvsMapping: ['C3.1', 'C3.2'],
    mitigations: ['access-controls', 'encryption', 'model-watermarking']
  },
  'adversarial-examples': {
    id: 'adversarial-examples',
    name: 'Adversarial Examples',
    description: 'Carefully crafted inputs designed to fool the AI model',
    severity: 'medium',
    likelihood: 'medium',
    category: 'Input Manipulation',
    aisvsMapping: ['C2.2', 'C1.9'],
    mitigations: ['adversarial-training', 'input-preprocessing', 'ensemble-methods']
  }
};

const controlRecommendations: Record<string, ControlRecommendation> = {
  'input-validation': {
    id: 'input-validation',
    name: 'Input Validation',
    description: 'Comprehensive validation of all user inputs before processing',
    priority: 'critical',
    implementationEffort: 'medium',
    aisvsCategory: 'C2.1',
    codeExample: `
// Input validation example
function validateInput(input: string): boolean {
  // Check for prompt injection patterns
  const injectionPatterns = [
    /ignore.{0,20}previous/i,
    /system.{0,20}prompt/i,
    /\\\\n\\\\nHuman:/i
  ];
  
  return !injectionPatterns.some(pattern => 
    pattern.test(input)
  );
}
    `
  },
  'rate-limiting': {
    id: 'rate-limiting',
    name: 'Rate Limiting',
    description: 'Control the rate of requests to prevent abuse and DoS attacks',
    priority: 'high',
    implementationEffort: 'low',
    aisvsCategory: 'C2.5',
    codeExample: `
// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
    `
  },
  'output-filtering': {
    id: 'output-filtering',
    name: 'Output Filtering',
    description: 'Filter and sanitize AI model outputs before returning to users',
    priority: 'high',
    implementationEffort: 'medium',
    aisvsCategory: 'C2.4',
    codeExample: `
// Output filtering function
function filterOutput(output: string): string {
  // Remove potential sensitive information
  const sensitivePatterns = [
    /\\b\\d{3}-\\d{2}-\\d{4}\\b/g, // SSN
    /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g // Email
  ];
  
  let filtered = output;
  sensitivePatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '[REDACTED]');
  });
  
  return filtered;
}
    `
  }
};

export const ThreatModeler: React.FC = () => {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  // Calculate threat analysis based on selected components
  const threatAnalysis = useMemo(() => {
    if (selectedComponents.length === 0) return null;

    const allThreats = new Set<string>();
    const allControls = new Set<string>();
    let totalRiskScore = 0;
    let componentCount = 0;

    selectedComponents.forEach(componentId => {
      const component = systemComponents.find(c => c.id === componentId);
      if (component) {
        component.threats.forEach(threat => allThreats.add(threat));
        component.controls.forEach(control => allControls.add(control));
        
        // Calculate risk score
        const riskValues = { low: 1, medium: 2, high: 3, critical: 4 };
        totalRiskScore += riskValues[component.riskLevel];
        componentCount++;
      }
    });

    const averageRisk = totalRiskScore / componentCount;
    const riskLevel = averageRisk >= 3.5 ? 'critical' : 
                     averageRisk >= 2.5 ? 'high' : 
                     averageRisk >= 1.5 ? 'medium' : 'low';

    return {
      threats: Array.from(allThreats),
      controls: Array.from(allControls),
      riskLevel,
      riskScore: Math.round(averageRisk * 10) / 10,
      componentCount
    };
  }, [selectedComponents]);

  const handleComponentToggle = (componentId: string) => {
    setSelectedComponents(prev => 
      prev.includes(componentId) 
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
    setAnalysisComplete(false);
  };

  const runAnalysis = () => {
    setAnalysisComplete(true);
    setActiveTab('threats');
  };

  const resetAnalysis = () => {
    setSelectedComponents([]);
    setAnalysisComplete(false);
    setActiveTab('components');
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-950/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-950/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-950/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-950/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Interactive Threat Modeler</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the components in your agentic AI system to receive a customized threat analysis 
          and security control recommendations based on OWASP AISVS standards.
        </p>
      </div>

      {/* Progress Indicator */}
      {selectedComponents.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Analysis Progress</span>
              <span className="text-sm text-muted-foreground">
                {selectedComponents.length} components selected
              </span>
            </div>
            <Progress 
              value={(selectedComponents.length / systemComponents.length) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">
            <Shield className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="threats" disabled={!analysisComplete}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="controls" disabled={!analysisComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="report" disabled={!analysisComplete}>
            <Download className="h-4 w-4 mr-2" />
            Report
          </TabsTrigger>
        </TabsList>

        {/* Component Selection Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Select Your System Components</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAnalysis}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={runAnalysis} 
                disabled={selectedComponents.length === 0}
                className="btn-primary"
              >
                <Zap className="h-4 w-4 mr-2" />
                Analyze Threats
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemComponents.map((component) => (
              <Card 
                key={component.id}
                className={`interactive-card ${
                  selectedComponents.includes(component.id) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : ''
                }`}
                onClick={() => handleComponentToggle(component.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedComponents.includes(component.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="p-2 rounded-lg bg-primary/10">
                        {component.icon}
                      </div>
                    </div>
                    <Badge className={getRiskColor(component.riskLevel)}>
                      {component.riskLevel}
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{component.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {component.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {component.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {component.threats.length} threats
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-6">
          {threatAnalysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="security-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {threatAnalysis.threats.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Identified Threats
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="security-card">
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${
                      threatAnalysis.riskLevel === 'critical' ? 'text-red-600' :
                      threatAnalysis.riskLevel === 'high' ? 'text-orange-600' :
                      threatAnalysis.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {threatAnalysis.riskScore}/4
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Risk Score
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="security-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {threatAnalysis.componentCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Components Analyzed
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className={`${
                threatAnalysis.riskLevel === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950/30' :
                threatAnalysis.riskLevel === 'high' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/30' :
                threatAnalysis.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30' :
                'border-green-200 bg-green-50 dark:bg-green-950/30'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Overall Risk Level: {threatAnalysis.riskLevel.toUpperCase()}</strong>
                  <br />
                  Your system configuration presents a {threatAnalysis.riskLevel} risk profile. 
                  Review the identified threats and implement recommended controls.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {threatAnalysis.threats.map(threatId => {
                  const threat = threatDefinitions[threatId];
                  if (!threat) return null;

                  return (
                    <Card key={threatId} className="threat-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{threat.name}</h4>
                            <p className="text-muted-foreground">{threat.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getRiskColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                            <Badge variant="outline">
                              {threat.likelihood} likelihood
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {threat.aisvsMapping.map(mapping => (
                            <Badge key={mapping} variant="secondary" className="text-xs">
                              AISVS {mapping}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>Category:</strong> {threat.category}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6">
          {threatAnalysis && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Recommended Security Controls</h3>
              
              {threatAnalysis.controls.map(controlId => {
                const control = controlRecommendations[controlId];
                if (!control) return null;

                return (
                  <Card key={controlId} className="control-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">{control.name}</h4>
                          <p className="text-muted-foreground">{control.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getRiskColor(control.priority)}>
                            {control.priority} priority
                          </Badge>
                          <Badge variant="outline">
                            {control.implementationEffort} effort
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Badge variant="secondary">
                          AISVS {control.aisvsCategory}
                        </Badge>
                      </div>
                      
                      {control.codeExample && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Implementation Example:</h5>
                          <pre className="text-xs overflow-auto">
                            <code>{control.codeExample.trim()}</code>
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-6">
          {threatAnalysis && (
            <Card className="security-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Threat Analysis Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                  <p className="text-muted-foreground">
                    Analysis of {threatAnalysis.componentCount} system components identified{' '}
                    {threatAnalysis.threats.length} potential threats with an overall risk level of{' '}
                    <span className={`font-semibold ${
                      threatAnalysis.riskLevel === 'critical' ? 'text-red-600' :
                      threatAnalysis.riskLevel === 'high' ? 'text-orange-600' :
                      threatAnalysis.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {threatAnalysis.riskLevel.toUpperCase()}
                    </span>.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button className="btn-primary">
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Report (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 