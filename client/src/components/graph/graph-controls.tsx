import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface GraphControlsProps {
  projectId: string;
  filters: {
    nodeTypes: string[];
    relationshipTypes: string[];
    minFrequency: number;
    searchQuery: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function GraphControls({ projectId, filters, onFiltersChange }: GraphControlsProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const { data: stats } = useQuery({
    queryKey: ["/api/projects", projectId, "stats"],
    enabled: !!projectId,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterUpdate = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const entityTypes = stats?.entityTypes || {};
  const relationshipTypes = stats?.relationshipTypes || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-secondary mb-6">Graph Controls</h3>
      
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Entities</label>
          <Input
            type="text"
            placeholder="Search for entities..."
            value={localFilters.searchQuery}
            onChange={(e) => handleFilterUpdate('searchQuery', e.target.value)}
          />
        </div>

        {/* Entity Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Entity Types</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(entityTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={localFilters.nodeTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...localFilters.nodeTypes, type]
                        : localFilters.nodeTypes.filter(t => t !== type);
                      handleFilterUpdate('nodeTypes', newTypes);
                    }}
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </div>
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Types</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(relationshipTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={localFilters.relationshipTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...localFilters.relationshipTypes, type]
                        : localFilters.relationshipTypes.filter(t => t !== type);
                      handleFilterUpdate('relationshipTypes', newTypes);
                    }}
                  />
                  <span className="text-sm text-gray-700">{type.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Minimum Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Frequency: {localFilters.minFrequency}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={localFilters.minFrequency}
            onChange={(e) => handleFilterUpdate('minFrequency', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Layout Algorithm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Layout Algorithm</label>
          <Select defaultValue="force-directed">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="force-directed">Force-directed</SelectItem>
              <SelectItem value="hierarchical">Hierarchical</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={applyFilters} className="w-full">
          Apply Filters
        </Button>

        {/* Reset Filters */}
        <Button
          variant="outline"
          onClick={() => {
            const resetFilters = {
              nodeTypes: [],
              relationshipTypes: [],
              minFrequency: 1,
              searchQuery: "",
            };
            setLocalFilters(resetFilters);
            onFiltersChange(resetFilters);
          }}
          className="w-full"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
