import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface GraphVisualizationProps {
  projectId: string;
  graphData: any;
  isLoading: boolean;
}

interface SelectedNode {
  id: string;
  label: string;
  type: string;
  properties: any;
}

export default function GraphVisualization({ projectId, graphData, isLoading }: GraphVisualizationProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!graphData || !graphContainerRef.current) return;

    // Initialize graph visualization
    // In a real implementation, this would use vis.js, D3.js, or similar
    const initializeGraph = async () => {
      try {
        // Mock implementation - in production, use a real graph library
        console.log('Initializing graph with data:', graphData);
        
        // Simulate node selection
        if (graphData.nodes && graphData.nodes.length > 0) {
          setSelectedNode(graphData.nodes[0]);
        }
      } catch (error) {
        console.error('Failed to initialize graph:', error);
      }
    };

    initializeGraph();
  }, [graphData]);

  const handleZoomIn = () => {
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    console.log('Zoom out');
  };

  const handleResetView = () => {
    console.log('Reset view');
  };

  const handleExport = () => {
    console.log('Export graph');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">Loading knowledge graph...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-project-diagram text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 font-medium">No Graph Data Available</p>
            <p className="text-sm text-gray-400 mt-1">Start scraping to build your knowledge graph</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary">Knowledge Graph Visualization</h3>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In">
            <i className="fas fa-search-plus"></i>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <i className="fas fa-search-minus"></i>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetView} title="Reset View">
            <i className="fas fa-home"></i>
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Fullscreen">
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport} title="Export">
            <i className="fas fa-download"></i>
          </Button>
        </div>
      </div>
      
      {/* Graph Container */}
      <div 
        ref={graphContainerRef} 
        className={`w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative ${
          isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'
        }`}
      >
        <div className="text-center">
          <i className="fas fa-project-diagram text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 font-medium">Interactive Knowledge Graph</p>
          <p className="text-sm text-gray-400 mt-1">
            {graphData.nodes.length} nodes, {graphData.edges.length} relationships
          </p>
          
          {/* Mock legend */}
          <div className="mt-4 space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              Person ({graphData.statistics?.entityTypes?.PERSON || 0})
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Organization ({graphData.statistics?.entityTypes?.ORG || 0})
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
              Location ({graphData.statistics?.entityTypes?.GPE || 0})
            </span>
          </div>
        </div>

        {/* Graph statistics overlay */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm">
          <div className="space-y-1">
            <div>Nodes: <span className="font-medium">{graphData.statistics?.nodeCount || 0}</span></div>
            <div>Edges: <span className="font-medium">{graphData.statistics?.edgeCount || 0}</span></div>
            <div>Density: <span className="font-medium">{graphData.statistics?.density || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-secondary mb-3">Selected Node: {selectedNode.label}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium text-secondary">{selectedNode.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Frequency:</span>
              <span className="ml-2 font-medium text-secondary">{selectedNode.properties?.frequency || 1}</span>
            </div>
            <div>
              <span className="text-gray-500">Documents:</span>
              <span className="ml-2 font-medium text-secondary">{selectedNode.properties?.documentCount || 0}</span>
            </div>
          </div>
          
          {/* Mock connected entities */}
          <div className="mt-3">
            <span className="text-gray-500 text-sm">Connected to:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Princeton University</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Theory of Relativity</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Nobel Prize</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Physics</span>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <Button size="sm" variant="outline">
              <i className="fas fa-search-plus mr-2"></i>
              Explore Neighbors
            </Button>
            <Button size="sm" variant="outline">
              <i className="fas fa-eye mr-2"></i>
              View Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
