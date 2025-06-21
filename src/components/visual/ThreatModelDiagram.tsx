import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  Database, 
  Network, 
  Cloud, 
  Users, 
  Brain,
  Lock,
  Eye,
  Zap
} from 'lucide-react';

interface ThreatVector {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  targetComponent: string;
  attackPath: string[];
}

const threatVectors: ThreatVector[] = [
  {
    id: 'prompt-injection',
    name: 'Prompt Injection',
    description: 'Malicious prompts that bypass system instructions',
    severity: 'critical',
    likelihood: 'high',
    targetComponent: 'ai-model',
    attackPath: ['user', 'api', 'ai-model']
  },
  {
    id: 'data-poisoning',
    name: 'Training Data Poisoning',
    description: 'Injection of malicious data during training',
    severity: 'high',
    likelihood: 'medium',
    targetComponent: 'training-data',
    attackPath: ['external-source', 'training-data', 'ai-model']
  },
  {
    id: 'model-extraction',
    name: 'Model Extraction',
    description: 'Unauthorized copying of model weights',
    severity: 'high',
    likelihood: 'medium',
    targetComponent: 'model-storage',
    attackPath: ['attacker', 'api', 'model-storage']
  },
  {
    id: 'adversarial-input',
    name: 'Adversarial Examples',
    description: 'Crafted inputs to fool the model',
    severity: 'medium',
    likelihood: 'high',
    targetComponent: 'ai-model',
    attackPath: ['user', 'api', 'ai-model']
  }
];

export const ThreatModelDiagram: React.FC = () => {
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  const handleThreatSelect = (threatId: string) => {
    const threat = threatVectors.find(t => t.id === threatId);
    if (threat) {
      setSelectedThreat(threatId);
      setHighlightedPath(threat.attackPath);
    }
  };

  const clearSelection = () => {
    setSelectedThreat(null);
    setHighlightedPath([]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const isComponentHighlighted = (componentId: string) => {
    return highlightedPath.includes(componentId);
  };

  const getComponentColor = (componentId: string) => {
    if (!selectedThreat) return '#3b82f6';
    if (isComponentHighlighted(componentId)) {
      const threat = threatVectors.find(t => t.id === selectedThreat);
      return threat ? getSeverityColor(threat.severity) : '#3b82f6';
    }
    return '#9ca3af';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">AI System Threat Model</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Interactive diagram showing potential attack vectors and data flows in an AI system. 
          Click on threats to see attack paths highlighted.
        </p>
      </div>

      <Tabs defaultValue="diagram" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagram">System Diagram</TabsTrigger>
          <TabsTrigger value="threats">Threat Vectors</TabsTrigger>
          <TabsTrigger value="controls">Security Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="diagram" className="space-y-6">
          <Card className="diagram-container">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI System Architecture & Attack Vectors</span>
                {selectedThreat && (
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg overflow-hidden">
                <svg
                  viewBox="0 0 800 400"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background Grid */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Data Flow Arrows */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                    </marker>
                    <marker id="arrowhead-threat" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                    </marker>
                  </defs>

                  {/* Normal Data Flows */}
                  <g className={selectedThreat ? 'opacity-30' : 'opacity-100'}>
                    {/* User to API */}
                    <line x1="150" y1="100" x2="250" y2="100" 
                          stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x="200" y="95" textAnchor="middle" className="text-xs fill-gray-600">Input</text>
                    
                    {/* API to AI Model */}
                    <line x1="350" y1="100" x2="450" y2="100" 
                          stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x="400" y="95" textAnchor="middle" className="text-xs fill-gray-600">Process</text>
                    
                    {/* Training Data to AI Model */}
                    <line x1="450" y1="250" x2="450" y2="150" 
                          stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x="470" y="200" className="text-xs fill-gray-600">Train</text>
                    
                    {/* AI Model to Storage */}
                    <line x1="500" y1="125" x2="580" y2="125" 
                          stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x="540" y="120" textAnchor="middle" className="text-xs fill-gray-600">Store</text>
                    
                    {/* Monitoring */}
                    <line x1="450" y1="150" x2="450" y2="300" 
                          stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
                    <text x="470" y="275" className="text-xs fill-gray-600">Monitor</text>
                  </g>

                  {/* Attack Path Arrows (shown when threat selected) */}
                  {selectedThreat && (
                    <g>
                      {highlightedPath.length > 1 && highlightedPath.map((component, index) => {
                        if (index === highlightedPath.length - 1) return null;
                        
                        const positions: Record<string, [number, number]> = {
                          'user': [100, 100],
                          'attacker': [100, 50],
                          'external-source': [100, 250],
                          'api': [300, 100],
                          'ai-model': [500, 125],
                          'training-data': [500, 250],
                          'model-storage': [650, 125]
                        };
                        
                        const start = positions[component];
                        const end = positions[highlightedPath[index + 1]];
                        
                        if (start && end) {
                          return (
                            <g key={`${component}-${highlightedPath[index + 1]}`}>
                              <line 
                                x1={start[0]} y1={start[1]} 
                                x2={end[0]} y2={end[1]} 
                                stroke="#ef4444" 
                                strokeWidth="3" 
                                strokeDasharray="8,4"
                                markerEnd="url(#arrowhead-threat)"
                                className="animate-pulse"
                              />
                            </g>
                          );
                        }
                        return null;
                      })}
                    </g>
                  )}

                  {/* System Components */}
                  
                  {/* User */}
                  <g>
                    <rect x="50" y="75" width="100" height="50" rx="8" 
                          fill={getComponentColor('user')} 
                          stroke={isComponentHighlighted('user') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('user') ? '3' : '2'} />
                    <text x="100" y="105" textAnchor="middle" className="text-sm font-medium fill-white">User</text>
                  </g>

                  {/* Attacker (shown when relevant) */}
                  {highlightedPath.includes('attacker') && (
                    <g>
                      <rect x="50" y="25" width="100" height="40" rx="8" 
                            fill="#ef4444" stroke="#dc2626" strokeWidth="3" />
                      <text x="100" y="50" textAnchor="middle" className="text-sm font-medium fill-white">Attacker</text>
                    </g>
                  )}

                  {/* External Source (shown when relevant) */}
                  {highlightedPath.includes('external-source') && (
                    <g>
                      <rect x="50" y="225" width="100" height="40" rx="8" 
                            fill={getComponentColor('external-source')} 
                            stroke={isComponentHighlighted('external-source') ? '#ef4444' : '#3b82f6'} 
                            strokeWidth={isComponentHighlighted('external-source') ? '3' : '2'} />
                      <text x="100" y="250" textAnchor="middle" className="text-sm font-medium fill-white">External Data</text>
                    </g>
                  )}

                  {/* API Gateway */}
                  <g>
                    <rect x="250" y="75" width="100" height="50" rx="8" 
                          fill={getComponentColor('api')} 
                          stroke={isComponentHighlighted('api') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('api') ? '3' : '2'} />
                    <text x="300" y="105" textAnchor="middle" className="text-sm font-medium fill-white">API Gateway</text>
                  </g>

                  {/* AI Model */}
                  <g>
                    <rect x="450" y="100" width="100" height="50" rx="8" 
                          fill={getComponentColor('ai-model')} 
                          stroke={isComponentHighlighted('ai-model') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('ai-model') ? '3' : '2'} />
                    <text x="500" y="130" textAnchor="middle" className="text-sm font-medium fill-white">AI Model</text>
                  </g>

                  {/* Training Data */}
                  <g>
                    <rect x="450" y="225" width="100" height="50" rx="8" 
                          fill={getComponentColor('training-data')} 
                          stroke={isComponentHighlighted('training-data') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('training-data') ? '3' : '2'} />
                    <text x="500" y="255" textAnchor="middle" className="text-sm font-medium fill-white">Training Data</text>
                  </g>

                  {/* Model Storage */}
                  <g>
                    <rect x="600" y="100" width="100" height="50" rx="8" 
                          fill={getComponentColor('model-storage')} 
                          stroke={isComponentHighlighted('model-storage') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('model-storage') ? '3' : '2'} />
                    <text x="650" y="130" textAnchor="middle" className="text-sm font-medium fill-white">Model Storage</text>
                  </g>

                  {/* Monitoring System */}
                  <g>
                    <rect x="450" y="300" width="100" height="40" rx="8" 
                          fill={getComponentColor('monitoring')} 
                          stroke={isComponentHighlighted('monitoring') ? '#ef4444' : '#3b82f6'} 
                          strokeWidth={isComponentHighlighted('monitoring') ? '3' : '2'} />
                    <text x="500" y="325" textAnchor="middle" className="text-sm font-medium fill-white">Monitoring</text>
                  </g>

                  {/* Security Boundaries */}
                  <rect x="220" y="50" width="160" height="100" rx="12" 
                        fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="8,4" opacity="0.7" />
                  <text x="300" y="45" textAnchor="middle" className="text-xs font-medium fill-green-600">Security Boundary</text>

                  <rect x="420" y="75" width="160" height="200" rx="12" 
                        fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="8,4" opacity="0.7" />
                  <text x="500" y="70" textAnchor="middle" className="text-xs font-medium fill-purple-600">ML Pipeline</text>
                </svg>
              </div>

              {selectedThreat && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-300">
                        {threatVectors.find(t => t.id === selectedThreat)?.name}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        {threatVectors.find(t => t.id === selectedThreat)?.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-950/50">
                          {threatVectors.find(t => t.id === selectedThreat)?.severity} severity
                        </Badge>
                        <Badge variant="outline">
                          {threatVectors.find(t => t.id === selectedThreat)?.likelihood} likelihood
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threatVectors.map((threat) => (
              <Card 
                key={threat.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedThreat === threat.id 
                    ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/30' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleThreatSelect(threat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{threat.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {threat.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <Badge style={{ backgroundColor: getSeverityColor(threat.severity) + '20', color: getSeverityColor(threat.severity) }}>
                      {threat.severity} severity
                    </Badge>
                    <Badge variant="outline">
                      {threat.likelihood} likelihood
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Attack Path:</strong> {threat.attackPath.join(' → ')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">Input Validation</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Validate and sanitize all inputs before processing
                </p>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30">
                  Prevents prompt injection
                </Badge>
              </CardContent>
            </Card>

            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold">Access Control</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Implement authentication and authorization
                </p>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30">
                  Prevents unauthorized access
                </Badge>
              </CardContent>
            </Card>

            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold">Monitoring</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Monitor model behavior and detect anomalies
                </p>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/30">
                  Detects attacks in progress
                </Badge>
              </CardContent>
            </Card>

            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30">
                    <Database className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold">Data Validation</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Validate training data quality and integrity
                </p>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/30">
                  Prevents data poisoning
                </Badge>
              </CardContent>
            </Card>

            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30">
                    <Zap className="h-5 w-5 text-red-600" />
                  </div>
                  <h4 className="font-semibold">Rate Limiting</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Limit request rates to prevent abuse
                </p>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30">
                  Prevents DoS attacks
                </Badge>
              </CardContent>
            </Card>

            <Card className="control-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/30">
                    <Network className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold">Network Security</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Secure network communications and boundaries
                </p>
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30">
                  Prevents network attacks
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 