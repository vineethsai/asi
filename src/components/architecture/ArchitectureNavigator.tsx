import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { architecturesData, Architecture } from '../components/architecturesData';
import { frameworkData } from '../components/frameworkData';
import { threatsData, mitigationsData } from '../components/securityData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ZoomIn, ZoomOut, RotateCcw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'architecture' | 'component' | 'threat' | 'mitigation';
  description: string;
  color: string;
  size: number;
  riskScore?: number;
  tags?: string[];
  group: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'arch-comp' | 'comp-threat' | 'threat-mitigation';
  strength: number;
}

const ArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [filters, setFilters] = useState({
    architecture: true,
    component: true,
    threat: true,
    mitigation: true
  });

  // Build graph data
  const { nodes, links } = useMemo(() => {
    console.log('Building graph data...');
    console.log('architecturesData:', architecturesData);
    console.log('frameworkData:', frameworkData);
    console.log('threatsData:', threatsData);
    console.log('mitigationsData:', mitigationsData);
    
    const nodeMap = new Map<string, GraphNode>();
    const linkArray: GraphLink[] = [];

    // Helper to add node
    const addNode = (id: string, name: string, type: GraphNode['type'], description: string, color: string, size: number, riskScore?: number, tags?: string[]) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          name,
          type,
          description,
          color,
          size,
          riskScore,
          tags,
          group: type === 'architecture' ? 0 : type === 'component' ? 1 : type === 'threat' ? 2 : 3
        });
      }
    };

    // Helper to add link
    const addLink = (sourceId: string, targetId: string, type: GraphLink['type'], strength: number = 1) => {
      linkArray.push({
        source: sourceId,
        target: targetId,
        type,
        strength
      });
    };

    try {
      // Add architecture nodes
      Object.values(architecturesData).forEach((arch: Architecture) => {
        addNode(
          arch.id,
          arch.name,
          'architecture',
          arch.description,
          arch.color || '#3b82f6',
          60,
          arch.riskScore,
          arch.tags
        );

        // Add component nodes and links
        (arch.keyComponents || []).forEach(compId => {
          const component = frameworkData.find(c => c.id === compId);
          if (component) {
            addNode(
              compId,
              component.title,
              'component',
              component.description,
              '#22c55e',
              40,
              undefined,
              component.threatCategories
            );
            addLink(arch.id, compId, 'arch-comp', 2);

            // Add threat nodes and links
            (arch.threatIds || []).forEach(threatId => {
              const threat = threatsData[threatId];
              if (threat && threat.componentIds?.includes(compId)) {
                addNode(
                  threatId,
                  threat.name,
                  'threat',
                  threat.description,
                  threat.color || '#ef4444',
                  30,
                  threat.riskScore,
                  threat.tags
                );
                addLink(compId, threatId, 'comp-threat', threat.riskScore ? threat.riskScore / 10 : 1);

                // Add mitigation nodes and links
                (arch.mitigationIds || []).forEach(mitigationId => {
                  const mitigation = mitigationsData[mitigationId];
                  if (mitigation && mitigation.threatIds?.includes(threatId)) {
                    addNode(
                      mitigationId,
                      mitigation.name,
                      'mitigation',
                      mitigation.description,
                      mitigation.color || '#f59e0b',
                      25,
                      undefined,
                      mitigation.tags
                    );
                    addLink(threatId, mitigationId, 'threat-mitigation', 1.5);
                  }
                });
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('Error building graph data:', error);
    }

    const result = {
      nodes: Array.from(nodeMap.values()),
      links: linkArray
    };
    
    console.log('Graph data built:', result);
    console.log('Total nodes:', result.nodes.length);
    console.log('Total links:', result.links.length);
    
    return result;
  }, []);

  // Filter nodes and links based on search and filters
  const filteredData = useMemo(() => {
    const filteredNodes = nodes.filter(node => {
      // Type filter
      if (!filters[node.type]) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, filters, searchTerm]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(600, rect.height)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !filteredData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create simulation
    const simulation = d3.forceSimulation<GraphNode>(filteredData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredData.links)
        .id(d => d.id)
        .distance(d => {
          switch (d.type) {
            case 'arch-comp': return 150;
            case 'comp-threat': return 100;
            case 'threat-mitigation': return 80;
            default: return 100;
          }
        })
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(d => {
          switch (d.type) {
            case 'architecture': return -2000;
            case 'component': return -1000;
            case 'threat': return -800;
            case 'mitigation': return -600;
            default: return -800;
          }
        }))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius(d => d.size + 10)
        .strength(0.7))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.1))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.1));

    simulationRef.current = simulation;

    // Create arrow markers for directed links
    const defs = svg.append('defs');
    
    ['arch-comp', 'comp-threat', 'threat-mitigation'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', type === 'arch-comp' ? '#3b82f6' : type === 'comp-threat' ? '#ef4444' : '#f59e0b');
    });

    // Create links
    const link = g.append('g')
      .selectAll('.link')
      .data(filteredData.links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        switch (d.type) {
          case 'arch-comp': return '#3b82f6';
          case 'comp-threat': return '#ef4444';
          case 'threat-mitigation': return '#f59e0b';
          default: return '#999';
        }
      })
      .attr('stroke-width', d => Math.max(1, d.strength * 2))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Create node groups
    const node = g.append('g')
      .selectAll('.node')
      .data(filteredData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag)
      .on('click', (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
      })
      .on('mouseover', (event, d) => {
        // Highlight connected nodes
        const connectedNodeIds = new Set<string>();
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          if (sourceId === d.id) connectedNodeIds.add(targetId);
          if (targetId === d.id) connectedNodeIds.add(sourceId);
        });

        node.style('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3);
        link.style('opacity', l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId === d.id || targetId === d.id ? 1 : 0.1;
        });
      })
      .on('mouseout', () => {
        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    // Add circles
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add risk indicators for threats
    node.filter(d => d.type === 'threat' && d.riskScore)
      .append('circle')
      .attr('r', d => d.size + 5)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const risk = d.riskScore || 0;
        return risk >= 8 ? '#dc2626' : risk >= 6 ? '#ea580c' : '#eab308';
      })
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5');

    // Add labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.size + 20)
      .attr('font-size', d => {
        switch (d.type) {
          case 'architecture': return '14px';
          case 'component': return '12px';
          case 'threat': return '10px';
          case 'mitigation': return '9px';
          default: return '10px';
        }
      })
      .attr('font-weight', d => d.type === 'architecture' ? 'bold' : 'normal')
      .attr('fill', '#374151')
      .text(d => {
        const maxLength = d.type === 'architecture' ? 20 : 15;
        return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
      });

    // Add type indicators
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(d => d.type.charAt(0).toUpperCase());

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial zoom to fit
    const bounds = g.node()?.getBBox();
    if (bounds) {
      const fullWidth = dimensions.width;
      const fullHeight = dimensions.height;
      const width = bounds.width;
      const height = bounds.height;
      const midX = bounds.x + width / 2;
      const midY = bounds.y + height / 2;
      const scale = Math.min(fullWidth / width, fullHeight / height) * 0.8;
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    return () => {
      simulation.stop();
    };
  }, [filteredData, dimensions]);

  // Control functions
  const zoomIn = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
      );
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1 / 1.5
      );
    }
  }, []);

  const resetZoom = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
  }, []);

  const toggleSimulation = useCallback(() => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
      setIsSimulationRunning(!isSimulationRunning);
    }
  }, [isSimulationRunning]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Controls Panel */}
      <div className="lg:w-80 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={zoomIn} variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={zoomOut} variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={resetZoom} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={toggleSimulation} variant="outline" size="sm">
                  {isSimulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Show/Hide</h4>
                {Object.entries(filters).map(([type, enabled]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{type}s</span>
                  </label>
                ))}
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>Architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Component</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>Threat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>Mitigation</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h3 className="font-semibold">{selectedNode.name}</h3>
                </div>
                
                <Badge variant="outline" className="capitalize">
                  {selectedNode.type}
                </Badge>
                
                <p className="text-sm text-muted-foreground">
                  {selectedNode.description}
                </p>
                
                {selectedNode.riskScore && (
                  <div>
                    <div className="text-sm font-medium mb-1">Risk Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            selectedNode.riskScore >= 8 ? "bg-red-500" :
                            selectedNode.riskScore >= 6 ? "bg-orange-500" :
                            "bg-yellow-500"
                          )}
                          style={{ width: `${(selectedNode.riskScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{selectedNode.riskScore}/10</span>
                    </div>
                  </div>
                )}
                
                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visualization */}
      <div className="flex-1" ref={containerRef}>
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchitectureNavigator;

// Export with old name for compatibility
export const HierarchicalArchitectureNavigator = ArchitectureNavigator; 