import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Network, Users, Zap, Brain, Target } from "lucide-react";
import { Text, Heading, Container, Flex, Box, Grid, Section, Tabs, Separator, Card as RadixCard, Avatar, IconButton, Dialog, Callout } from '@radix-ui/themes';
import ArchitectureDiagram from '@/components/visual/ArchitectureDiagrams';

export const ArchitectureShowcase = () => {
  const architectures = [
    {
      id: 'sequential',
      name: 'Sequential Agent',
      description: 'Linear workflow with single LLM processing tasks step-by-step',
      icon: ArrowRight,
      color: 'blue',
      complexity: 'Simple',
      useCase: 'Basic automation'
    },
    {
      id: 'hierarchical',
      name: 'Hierarchical',
      description: 'Orchestrator delegates tasks to specialized sub-agents',
      icon: Network,
      color: 'green',
      complexity: 'Complex',
      useCase: 'Enterprise systems'
    },
    {
      id: 'collaborative',
      name: 'Collaborative Swarm',
      description: 'Decentralized peer-to-peer agent collaboration',
      icon: Users,
      color: 'orange',
      complexity: 'Advanced',
      useCase: 'Distributed problem-solving'
    },
    {
      id: 'reactive',
      name: 'Reactive',
      description: 'Event-driven responses with ReAct paradigm',
      icon: Zap,
      color: 'yellow',
      complexity: 'Moderate',
      useCase: 'Real-time systems'
    },
    {
      id: 'knowledge_intensive',
      name: 'Knowledge-Intensive',
      description: 'RAG-based processing with external knowledge integration',
      icon: Brain,
      color: 'purple',
      complexity: 'Advanced',
      useCase: 'Research & analysis'
    }
  ];

  return (
    <Section className="py-16 lg:py-24">
      <Container size="4">
        <Box className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Target className="h-4 w-4 mr-2" />
            Architecture Patterns
          </Badge>
          <Heading size="8" className="mb-4">
            AI Agent Architecture Diagrams
          </Heading>
          <Text size="5" className="text-muted-foreground max-w-3xl mx-auto">
            Interactive SVG diagrams showcasing different AI agent architecture patterns 
            with detailed component relationships and data flows.
          </Text>
        </Box>

        <Tabs.Root defaultValue="sequential" className="w-full">
          <Tabs.List className="grid w-full grid-cols-5 mb-8 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
            {architectures.map((arch) => (
              <Tabs.Trigger 
                key={arch.id} 
                value={arch.id} 
                className="flex flex-col items-center gap-2 p-4 rounded-md transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
              >
                <arch.icon className="h-5 w-5" />
                <Text size="2" weight="medium">{arch.name}</Text>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {architectures.map((arch) => (
            <Tabs.Content key={arch.id} value={arch.id} className="space-y-6">
              <RadixCard className="overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                <Grid columns="2" gap="0" className="min-h-[400px]">
                  {/* Diagram Side */}
                  <Box className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
                    <ArchitectureDiagram 
                      architectureId={arch.id} 
                      className="w-full h-80 drop-shadow-lg" 
                    />
                  </Box>
                    
                    {/* Info Side */}
                    <Box className="p-8 space-y-6">
                      <Box>
                        <Flex align="center" gap="3" className="mb-4">
                          <Box className={`p-3 rounded-lg bg-${arch.color}-500 text-white`}>
                            <arch.icon className="h-6 w-6" />
                          </Box>
                          <Box>
                            <Heading size="6">{arch.name}</Heading>
                            <Text size="3" className="text-muted-foreground">{arch.complexity} Architecture</Text>
                          </Box>
                        </Flex>
                        
                        <Text size="4" className="leading-relaxed mb-4">
                          {arch.description}
                        </Text>
                      </Box>

                      <Separator />

                      <Box className="space-y-4">
                        <Box>
                          <Text size="3" weight="bold" className="mb-2">Complexity Level</Text>
                          <Badge variant={arch.complexity === 'Simple' ? 'secondary' : 
                                        arch.complexity === 'Moderate' ? 'default' : 'destructive'}>
                            {arch.complexity}
                          </Badge>
                        </Box>
                        
                        <Box>
                          <Text size="3" weight="bold" className="mb-2">Primary Use Case</Text>
                          <Text size="3" className="text-muted-foreground">{arch.useCase}</Text>
                        </Box>
                      </Box>

                      <Separator />

                      <Box className="space-y-3">
                        <Text size="3" weight="bold">Key Features</Text>
                        <Box className="space-y-2">
                          {arch.id === 'sequential' && (
                            <>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-blue-500 rounded-full" />
                                <Text size="2">Linear task processing</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-blue-500 rounded-full" />
                                <Text size="2">Single LLM core</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-blue-500 rounded-full" />
                                <Text size="2">Session-specific memory</Text>
                              </Flex>
                            </>
                          )}
                          {arch.id === 'hierarchical' && (
                            <>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-green-500 rounded-full" />
                                <Text size="2">Task orchestration</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-green-500 rounded-full" />
                                <Text size="2">Specialized sub-agents</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-green-500 rounded-full" />
                                <Text size="2">Shared memory system</Text>
                              </Flex>
                            </>
                          )}
                          {arch.id === 'collaborative' && (
                            <>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-orange-500 rounded-full" />
                                <Text size="2">Peer-to-peer communication</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-orange-500 rounded-full" />
                                <Text size="2">Distributed decision making</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-orange-500 rounded-full" />
                                <Text size="2">Collective knowledge sharing</Text>
                              </Flex>
                            </>
                          )}
                          {arch.id === 'reactive' && (
                            <>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <Text size="2">Event-driven responses</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <Text size="2">ReAct paradigm</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <Text size="2">Real-time adaptation</Text>
                              </Flex>
                            </>
                          )}
                          {arch.id === 'knowledge_intensive' && (
                            <>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-purple-500 rounded-full" />
                                <Text size="2">RAG integration</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-purple-500 rounded-full" />
                                <Text size="2">External knowledge sources</Text>
                              </Flex>
                              <Flex align="center" gap="2">
                                <Box className="w-2 h-2 bg-purple-500 rounded-full" />
                                <Text size="2">Persistent knowledge cache</Text>
                              </Flex>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Box className="pt-4">
                        <Link to={`/architectures/${arch.id}`}>
                          <Button className="w-full gap-2">
                            Learn More
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </Box>
                    </Box>
                  </Grid>
                </RadixCard>
              </Tabs.Content>
          ))}
        </Tabs.Root>

        <Box className="text-center mt-12">
          <Link to="/architectures">
            <Button variant="outline" size="lg" className="gap-2">
              <Network className="h-5 w-5" />
              View All Architectures
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Box>
      </Container>
    </Section>
  );
};

export default ArchitectureShowcase; 