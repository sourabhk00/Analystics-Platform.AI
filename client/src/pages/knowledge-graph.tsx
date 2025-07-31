import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import GraphControls from "@/components/graph/graph-controls";
import GraphVisualization from "@/components/graph/graph-visualization";
import GraphStatistics from "@/components/graph/graph-statistics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function KnowledgeGraph() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [graphFilters, setGraphFilters] = useState({
    nodeTypes: [],
    relationshipTypes: [],
    minFrequency: 1,
    searchQuery: "",
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "graph"],
    enabled: !!selectedProjectId,
  });

  const { data: filteredGraphData, refetch: refetchFiltered } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "graph", "filtered"],
    enabled: false,
  });

  const handleFilterChange = async (newFilters: typeof graphFilters) => {
    setGraphFilters(newFilters);
    if (selectedProjectId) {
      // Apply filters
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/graph/filter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFilters),
        });
        if (response.ok) {
          refetchFiltered();
        }
      } catch (error) {
        console.error('Failed to apply filters:', error);
      }
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Select Project</h3>
          <div className="w-64">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to explore" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(projects) && projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedProjectId && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Graph Controls */}
          <div className="xl:col-span-1 space-y-6">
            <GraphControls
              projectId={selectedProjectId}
              filters={graphFilters}
              onFiltersChange={handleFilterChange}
            />
            <GraphStatistics graphData={filteredGraphData || graphData} />
          </div>

          {/* Graph Visualization */}
          <div className="xl:col-span-3">
            <GraphVisualization
              projectId={selectedProjectId}
              graphData={filteredGraphData || graphData}
              isLoading={graphLoading}
            />
          </div>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-project-diagram text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project above to explore its knowledge graph</p>
        </div>
      )}
    </div>
  );
}
