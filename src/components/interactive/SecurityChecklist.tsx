import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Database, 
  Network, 
  Eye, 
  Lock,
  FileText,
  Download,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  aisvsReference: string;
  implementationGuide: string;
  codeExample?: string;
  estimatedTime: string;
  dependencies?: string[];
  verificationSteps: string[];
}

interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  items: ChecklistItem[];
}

const securityChecklist: ChecklistCategory[] = [
  {
    id: 'input-validation',
    name: 'Input Validation & Filtering',
    description: 'Protect against prompt injection and malicious inputs',
    icon: <Shield className="h-5 w-5" />,
    color: 'blue',
    items: [
      {
        id: 'prompt-injection-defense',
        title: 'Implement Prompt Injection Defense',
        description: 'Deploy comprehensive protection against prompt injection attacks',
        category: 'input-validation',
        priority: 'critical',
        aisvsReference: 'C2.1',
        implementationGuide: 'Set up multi-layered defense including input validation, instruction hierarchy enforcement, and pattern detection for known injection techniques.',
        codeExample: `
// Prompt injection detection
const injectionPatterns = [
  /ignore.{0,20}previous/i,
  /system.{0,20}prompt/i,
  /\\\\n\\\\nHuman:/i,
  /roleplay/i,
  /pretend/i
];

function detectPromptInjection(input: string): boolean {
  return injectionPatterns.some(pattern => pattern.test(input));
}

function validateInput(input: string): { valid: boolean; reason?: string } {
  if (detectPromptInjection(input)) {
    return { valid: false, reason: 'Potential prompt injection detected' };
  }
  
  if (input.length > 4000) {
    return { valid: false, reason: 'Input too long' };
  }
  
  return { valid: true };
}
        `,
        estimatedTime: '4-8 hours',
        verificationSteps: [
          'Test with known injection patterns',
          'Verify instruction hierarchy is maintained',
          'Check that malicious prompts are blocked',
          'Ensure legitimate inputs still work'
        ]
      },
      {
        id: 'input-sanitization',
        title: 'Input Sanitization & Normalization',
        description: 'Clean and normalize user inputs before processing',
        category: 'input-validation',
        priority: 'high',
        aisvsReference: 'C2.2',
        implementationGuide: 'Implement Unicode normalization, homoglyph detection, and content sanitization to prevent adversarial inputs.',
        codeExample: `
import { normalize } from 'normalize-unicode';

function sanitizeInput(input: string): string {
  // Unicode normalization
  let sanitized = normalize(input, 'NFC');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
  
  // Homoglyph detection and replacement
  const homoglyphMap: Record<string, string> = {
    'а': 'a', 'о': 'o', 'р': 'p', 'е': 'e', // Cyrillic to Latin
    '０': '0', '１': '1', '２': '2', // Fullwidth to ASCII
  };
  
  Object.entries(homoglyphMap).forEach(([from, to]) => {
    sanitized = sanitized.replace(new RegExp(from, 'g'), to);
  });
  
  return sanitized.trim();
}
        `,
        estimatedTime: '2-4 hours',
        verificationSteps: [
          'Test with Unicode variations',
          'Verify homoglyph detection works',
          'Check normalization preserves meaning',
          'Validate against bypass attempts'
        ]
      },
      {
        id: 'content-filtering',
        title: 'Content Policy Screening',
        description: 'Screen inputs and outputs for policy violations',
        category: 'input-validation',
        priority: 'high',
        aisvsReference: 'C2.4',
        implementationGuide: 'Deploy content classifiers to detect harmful content categories including violence, hate speech, and inappropriate requests.',
        estimatedTime: '6-12 hours',
        verificationSteps: [
          'Test content classifier accuracy',
          'Verify policy violations are blocked',
          'Check false positive rates',
          'Validate safe content passes through'
        ]
      }
    ]
  },
  {
    id: 'data-security',
    name: 'Training Data Security',
    description: 'Secure training data and prevent poisoning attacks',
    icon: <Database className="h-5 w-5" />,
    color: 'green',
    items: [
      {
        id: 'data-provenance',
        title: 'Maintain Data Provenance',
        description: 'Track and document the source and history of all training data',
        category: 'data-security',
        priority: 'critical',
        aisvsReference: 'C1.1',
        implementationGuide: 'Implement comprehensive data lineage tracking including source, steward, license, collection method, and processing history.',
        estimatedTime: '8-16 hours',
        verificationSteps: [
          'Verify all data sources are documented',
          'Check lineage tracking is complete',
          'Validate metadata accuracy',
          'Ensure audit trail exists'
        ]
      },
      {
        id: 'data-validation',
        title: 'Automated Data Quality Validation',
        description: 'Implement automated checks for data quality and integrity',
        category: 'data-security',
        priority: 'high',
        aisvsReference: 'C1.5',
        implementationGuide: 'Set up automated validation pipelines to detect format errors, null values, label inconsistencies, and statistical anomalies.',
        codeExample: `
interface DataValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDataset(data: any[]): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Check for null values
  const nullCount = data.filter(item => item === null || item === undefined).length;
  if (nullCount > data.length * 0.05) {
    result.errors.push(\`High null value rate: \${(nullCount/data.length*100).toFixed(1)}%\`);
    result.valid = false;
  }
  
  // Check data distribution
  const uniqueValues = new Set(data).size;
  if (uniqueValues < data.length * 0.1) {
    result.warnings.push('Low data diversity detected');
  }
  
  return result;
}
        `,
        estimatedTime: '4-8 hours',
        verificationSteps: [
          'Test validation with corrupted data',
          'Verify error detection accuracy',
          'Check performance with large datasets',
          'Validate quarantine mechanisms work'
        ]
      },
      {
        id: 'poisoning-detection',
        title: 'Data Poisoning Detection',
        description: 'Implement anomaly detection to identify potential data poisoning',
        category: 'data-security',
        priority: 'high',
        aisvsReference: 'C1.6',
        implementationGuide: 'Deploy statistical and ML-based anomaly detection to identify suspicious patterns in training data that could indicate poisoning attempts.',
        estimatedTime: '12-20 hours',
        verificationSteps: [
          'Test with known poisoning examples',
          'Verify detection sensitivity',
          'Check false positive rates',
          'Validate alerting mechanisms'
        ]
      }
    ]
  },
  {
    id: 'access-control',
    name: 'Access Control & Authentication',
    description: 'Secure access to AI systems and data',
    icon: <Lock className="h-5 w-5" />,
    color: 'purple',
    items: [
      {
        id: 'api-authentication',
        title: 'API Authentication & Authorization',
        description: 'Implement robust authentication for all API endpoints',
        category: 'access-control',
        priority: 'critical',
        aisvsReference: 'C3.1',
        implementationGuide: 'Deploy strong authentication mechanisms including API keys, OAuth 2.0, or JWT tokens with proper authorization controls.',
        codeExample: `
import jwt from 'jsonwebtoken';

interface AuthMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
}

const authenticateToken: AuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
        `,
        estimatedTime: '4-8 hours',
        verificationSteps: [
          'Test authentication with valid tokens',
          'Verify unauthorized access is blocked',
          'Check token expiration handling',
          'Validate rate limiting works'
        ]
      },
      {
        id: 'rate-limiting',
        title: 'Rate Limiting & Abuse Prevention',
        description: 'Implement rate limiting to prevent abuse and DoS attacks',
        category: 'access-control',
        priority: 'high',
        aisvsReference: 'C2.5',
        implementationGuide: 'Configure rate limiting per user, IP, and API key with different limits for different endpoints based on computational cost.',
        estimatedTime: '2-4 hours',
        verificationSteps: [
          'Test rate limits are enforced',
          'Verify different limits per endpoint',
          'Check burst handling',
          'Validate legitimate users not blocked'
        ]
      }
    ]
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Logging',
    description: 'Monitor AI system behavior and maintain audit logs',
    icon: <Eye className="h-5 w-5" />,
    color: 'orange',
    items: [
      {
        id: 'model-monitoring',
        title: 'Real-time Model Monitoring',
        description: 'Monitor model behavior for drift, anomalies, and security issues',
        category: 'monitoring',
        priority: 'critical',
        aisvsReference: 'C3.3',
        implementationGuide: 'Implement continuous monitoring of model inputs, outputs, and performance metrics to detect drift, anomalies, or potential attacks.',
        estimatedTime: '8-16 hours',
        verificationSteps: [
          'Verify drift detection works',
          'Check anomaly alerting',
          'Test performance monitoring',
          'Validate dashboard functionality'
        ]
      },
      {
        id: 'security-logging',
        title: 'Comprehensive Security Logging',
        description: 'Log all security-relevant events for audit and investigation',
        category: 'monitoring',
        priority: 'high',
        aisvsReference: 'C3.4',
        implementationGuide: 'Implement structured logging of authentication events, access attempts, input validation failures, and model interactions.',
        codeExample: `
interface SecurityEvent {
  timestamp: string;
  eventType: 'auth_failure' | 'input_validation_failed' | 'rate_limit_exceeded' | 'anomaly_detected';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: new Date().toISOString(),
    id: generateEventId()
  };
  
  // Send to security monitoring system
  securityLogger.log(logEntry);
  
  // Alert if high severity
  if (event.severity === 'critical' || event.severity === 'high') {
    alertingSystem.sendAlert(logEntry);
  }
}
        `,
        estimatedTime: '4-8 hours',
        verificationSteps: [
          'Verify all events are logged',
          'Check log format consistency',
          'Test alerting for high severity',
          'Validate log retention works'
        ]
      }
    ]
  }
];

export const SecurityChecklist: React.FC = () => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('input-validation');
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  // Load completed items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-security-checklist');
    if (saved) {
      setCompletedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save completed items to localStorage
  useEffect(() => {
    localStorage.setItem('ai-security-checklist', JSON.stringify(Array.from(completedItems)));
  }, [completedItems]);

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const resetChecklist = () => {
    setCompletedItems(new Set());
    localStorage.removeItem('ai-security-checklist');
  };

  // Calculate progress
  const totalItems = securityChecklist.reduce((sum, category) => sum + category.items.length, 0);
  const completedCount = completedItems.size;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  // Get category progress
  const getCategoryProgress = (categoryId: string) => {
    const category = securityChecklist.find(c => c.id === categoryId);
    if (!category) return 0;
    
    const categoryCompleted = category.items.filter(item => completedItems.has(item.id)).length;
    return (categoryCompleted / category.items.length) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300';
    }
  };

  const getSecurityScore = () => {
    const criticalItems = securityChecklist.flatMap(c => c.items).filter(i => i.priority === 'critical');
    const highItems = securityChecklist.flatMap(c => c.items).filter(i => i.priority === 'high');
    
    const criticalCompleted = criticalItems.filter(i => completedItems.has(i.id)).length;
    const highCompleted = highItems.filter(i => completedItems.has(i.id)).length;
    
    const criticalScore = criticalItems.length > 0 ? (criticalCompleted / criticalItems.length) * 60 : 60;
    const highScore = highItems.length > 0 ? (highCompleted / highItems.length) * 30 : 30;
    const overallScore = (completedCount / totalItems) * 10;
    
    return Math.round(criticalScore + highScore + overallScore);
  };

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">AI Security Implementation Checklist</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Follow this comprehensive checklist to implement security controls for your AI system 
          based on OWASP AISVS standards. Track your progress and get implementation guidance.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {completedCount}/{totalItems}
            </div>
            <div className="text-sm text-muted-foreground">Items Complete</div>
          </CardContent>
        </Card>
        
        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-muted-foreground">Progress</div>
          </CardContent>
        </Card>
        
        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold mb-1 ${
              securityScore >= 80 ? 'text-green-600' : 
              securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {securityScore}/100
            </div>
            <div className="text-sm text-muted-foreground">Security Score</div>
          </CardContent>
        </Card>
        
        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {securityChecklist.filter(c => getCategoryProgress(c.id) === 100).length}
            </div>
            <div className="text-sm text-muted-foreground">Categories Done</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Security Implementation</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              >
                {showCompletedOnly ? 'Show All' : 'Show Completed'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetChecklist}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
          
          {securityScore < 80 && (
            <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Score: {securityScore}/100</strong>
                <br />
                {securityScore < 40 && "Critical security gaps identified. Prioritize implementing critical and high priority items."}
                {securityScore >= 40 && securityScore < 60 && "Moderate security posture. Focus on completing high priority items."}
                {securityScore >= 60 && securityScore < 80 && "Good progress! Complete remaining critical items to improve security."}
              </AlertDescription>
            </Alert>
          )}
          
          {securityScore >= 80 && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-950/30 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Excellent Security Score: {securityScore}/100</strong>
                <br />
                Your AI system has strong security controls implemented. Continue monitoring and maintaining these controls.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {securityChecklist.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              <span className="hidden sm:inline">{category.name.split(' ')[0]}</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(getCategoryProgress(category.id))}%
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {securityChecklist.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card className="security-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${category.color}-100 dark:bg-${category.color}-950/30`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl">{category.name}</h3>
                    <p className="text-muted-foreground text-sm font-normal">
                      {category.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Category Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {category.items.filter(item => completedItems.has(item.id)).length}/{category.items.length} complete
                  </span>
                </div>
                <Progress value={getCategoryProgress(category.id)} className="h-2" />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {category.items
                .filter(item => !showCompletedOnly || completedItems.has(item.id))
                .map((item) => (
                <Card 
                  key={item.id} 
                  className={`checklist-item ${completedItems.has(item.id) ? 'completed' : ''}`}
                >
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={item.id} className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-start gap-4 w-full">
                            <Checkbox
                              checked={completedItems.has(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{item.title}</h4>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.aisvsReference}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>⏱️ {item.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium mb-2">Implementation Guide</h5>
                              <p className="text-sm text-muted-foreground">
                                {item.implementationGuide}
                              </p>
                            </div>
                            
                            {item.codeExample && (
                              <div>
                                <h5 className="font-medium mb-2">Code Example</h5>
                                <pre className="text-xs overflow-auto bg-muted p-4 rounded-lg">
                                  <code>{item.codeExample.trim()}</code>
                                </pre>
                              </div>
                            )}
                            
                            <div>
                              <h5 className="font-medium mb-2">Verification Steps</h5>
                              <ul className="space-y-1">
                                {item.verificationSteps.map((step, index) => (
                                  <li key={index} className="flex items-center gap-2 text-sm">
                                    <Target className="h-3 w-3 text-muted-foreground" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {item.dependencies && (
                              <div>
                                <h5 className="font-medium mb-2">Dependencies</h5>
                                <div className="flex flex-wrap gap-2">
                                  {item.dependencies.map((dep, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {dep}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Export Options */}
      <Card className="security-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export Progress Report
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Implementation Plan
          </Button>
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Schedule Security Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 