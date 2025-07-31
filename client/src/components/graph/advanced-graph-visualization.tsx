import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Node {
  id: string;
  name: string;
  type: string;
  frequency: number;
  group: string;
  x?: number;
  y?: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  statistics: any;
}

interface AdvancedGraphVisualizationProps {
  projectId: string;
  graphData: GraphData | null;
  isLoading: boolean;
}

export default function AdvancedGraphVisualization({ 
  projectId, 
  graphData, 
  isLoading 
}: AdvancedGraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [layoutType, setLayoutType] = useState('force');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterMinFrequency, setFilterMinFrequency] = useState([1]);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<any>(null);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height - 100 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Filter nodes based on frequency
    const filteredNodes = graphData.nodes.filter(
      node => node.frequency >= filterMinFrequency[0]
    );
    
    const filteredEdges = graphData.edges.filter(
      edge => filteredNodes.some(n => n.id === edge.source) && 
              filteredNodes.some(n => n.id === edge.target)
    );

    // Initialize positions if not set
    filteredNodes.forEach(node => {
      if (!node.x || !node.y) {
        node.x = Math.random() * dimensions.width;
        node.y = Math.random() * dimensions.height;
      }
    });

    // Create force simulation for dynamic layout
    if (layoutType === 'force') {
      simulateForceLayout(filteredNodes, filteredEdges, dimensions);
    } else if (layoutType === 'circular') {
      applyCircularLayout(filteredNodes, dimensions);
    } else if (layoutType === 'hierarchical') {
      applyHierarchicalLayout(filteredNodes, filteredEdges, dimensions);
    }

    // Animation loop
    const animate = () => {
      drawGraph(ctx, filteredNodes, filteredEdges, dimensions);
      if (layoutType === 'force' && simulation) {
        requestAnimationFrame(animate);
      }
    };

    animate();

  }, [graphData, dimensions, layoutType, filterMinFrequency, zoomLevel]);

  const simulateForceLayout = (nodes: Node[], edges: Edge[], dims: any) => {
    // Simple force-directed layout simulation
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Repulsion between nodes
      nodes.forEach(node1 => {
        nodes.forEach(node2 => {
          if (node1.id !== node2.id && node1.x && node1.y && node2.x && node2.y) {
            const dx = node1.x - node2.x;
            const dy = node1.y - node2.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (distance * distance);
            
            node1.x += (dx / distance) * force * 0.1;
            node1.y += (dy / distance) * force * 0.1;
          }
        });
      });

      // Attraction along edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        
        if (source && target && source.x && source.y && target.x && target.y) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * 0.01;
          
          source.x += (dx / distance) * force;
          source.y += (dy / distance) * force;
          target.x -= (dx / distance) * force;
          target.y -= (dy / distance) * force;
        }
      });

      // Center attraction
      nodes.forEach(node => {
        if (node.x && node.y) {
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.x += dx * 0.01;
          node.y += dy * 0.01;
        }
      });

      // Keep nodes within bounds
      nodes.forEach(node => {
        if (node.x) node.x = Math.max(50, Math.min(dims.width - 50, node.x));
        if (node.y) node.y = Math.max(50, Math.min(dims.height - 50, node.y));
      });
    }
  };

  const applyCircularLayout = (nodes: Node[], dims: any) => {
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;
    const radius = Math.min(dims.width, dims.height) * 0.3;
    
    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
  };

  const applyHierarchicalLayout = (nodes: Node[], edges: Edge[], dims: any) => {
    // Group nodes by type
    const typeGroups: { [key: string]: Node[] } = {};
    nodes.forEach(node => {
      if (!typeGroups[node.type]) typeGroups[node.type] = [];
      typeGroups[node.type].push(node);
    });

    const types = Object.keys(typeGroups);
    const levelHeight = dims.height / (types.length + 1);

    types.forEach((type, typeIndex) => {
      const levelNodes = typeGroups[type];
      const nodeWidth = dims.width / (levelNodes.length + 1);
      
      levelNodes.forEach((node, nodeIndex) => {
        node.x = nodeWidth * (nodeIndex + 1);
        node.y = levelHeight * (typeIndex + 1);
      });
    });
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, nodes: Node[], edges: Edge[], dims: any) => {
    // Clear canvas
    ctx.clearRect(0, 0, dims.width, dims.height);
    
    // Apply zoom
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    // Draw edges
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Highlight if part of selected path
        if (highlightedPath.includes(edge.id)) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
        }
        
        ctx.stroke();

        // Draw edge labels for important relationships
        if (edge.type && ctx.lineWidth > 1) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          
          ctx.fillStyle = '#374151';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(edge.type, midX, midY);
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const radius = Math.max(5, Math.min(20, Math.sqrt(node.frequency) * 3));
      
      // Node color based on type
      const colors: { [key: string]: string } = {
        'PERSON': '#ef4444',
        'ORG': '#3b82f6',
        'GPE': '#10b981',
        'LOCATION': '#10b981',
        'TOPIC': '#8b5cf6',
        'DATE': '#f59e0b',
        'NORP': '#ec4899'
      };
      
      ctx.fillStyle = colors[node.type] || '#6b7280';
      
      // Highlight selected node
      if (selectedNode?.id === node.id) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
      }
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw node labels
      ctx.fillStyle = '#1f2937';
      ctx.font = `${Math.max(8, radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(
        node.name.length > 15 ? node.name.substring(0, 12) + '...' : node.name,
        node.x,
        node.y + radius + 12
      );
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    // Find clicked node
    const clickedNode = graphData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      const radius = Math.max(5, Math.min(20, Math.sqrt(node.frequency) * 3));
      return distance <= radius;
    });

    setSelectedNode(clickedNode || null);
  };

  const exportGraph = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `knowledge-graph-${projectId}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </CardContent>
      </Card>
    );
  }

  if (!graphData) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <i className="fas fa-project-diagram text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Graph Data</h3>
          <p className="text-gray-500">Complete a scraping project to generate the knowledge graph</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graph Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-cogs text-indigo-600 mr-3"></i>
              Graph Controls
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportGraph} variant="outline" size="sm">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <Select value={layoutType} onValueChange={setLayoutType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force-Directed</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Level</label>
              <Slider
                value={[zoomLevel]}
                onValueChange={(value) => setZoomLevel(value[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Frequency</label>
              <Slider
                value={filterMinFrequency}
                onValueChange={setFilterMinFrequency}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="flex items-end">
              <div className="text-center">
                <p className="text-sm text-gray-600">Nodes: {graphData.nodes.length}</p>
                <p className="text-sm text-gray-600">Edges: {graphData.edges.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Graph Canvas */}
        <div className="lg:col-span-3">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-project-diagram text-purple-600 mr-3"></i>
                Interactive Knowledge Graph
              </CardTitle>
            </CardHeader>
            <CardContent ref={containerRef} className="p-4">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="border border-gray-200 rounded-lg cursor-crosshair w-full"
                style={{ height: '500px' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Node Details Panel */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <i className="fas fa-info-circle text-blue-600 mr-2"></i>
                Node Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedNode ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{selectedNode.name}</h4>
                    <Badge variant="secondary" className="mt-1">{selectedNode.type}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Frequency:</span> {selectedNode.frequency}</p>
                    <p><span className="font-medium">Group:</span> {selectedNode.group}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <h5 className="font-medium text-gray-700 mb-2">Connected To:</h5>
                    <div className="space-y-1">
                      {graphData.edges
                        .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                        .slice(0, 5)
                        .map(edge => {
                          const connectedNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                          const connectedNode = graphData.nodes.find(n => n.id === connectedNodeId);
                          return (
                            <div key={edge.id} className="text-xs">
                              <span className="text-gray-500">{edge.type}:</span> {connectedNode?.name}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Click on a node to see details</p>
              )}
            </CardContent>
          </Card>

          {/* Graph Statistics */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <i className="fas fa-chart-bar text-green-600 mr-2"></i>
                Graph Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {graphData.statistics && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Density</span>
                    <span className="font-medium">{(graphData.statistics.density * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Degree</span>
                    <span className="font-medium">{graphData.statistics.averageDegree?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Components</span>
                    <span className="font-medium">{graphData.statistics.connectedComponents || 1}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}