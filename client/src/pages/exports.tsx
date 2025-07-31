import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ExportRequest {
  projectId: string;
  format: "csv" | "excel" | "json" | "cypher";
  includeContent: boolean;
  includeRelationships: boolean;
  includeImages: boolean;
  metadataOnly: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export default function Exports() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "json" | "cypher">("csv");
  const [exportOptions, setExportOptions] = useState({
    includeContent: true,
    includeRelationships: true,
    includeImages: false,
    metadataOnly: false,
  });
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const { toast } = useToast();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: exports, isLoading: exportsLoading } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "exports"],
    enabled: !!selectedProjectId,
  });

  const exportMutation = useMutation({
    mutationFn: async (exportRequest: ExportRequest) => {
      const response = await apiRequest("POST", `/api/projects/${exportRequest.projectId}/export`, exportRequest);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Export Started",
        description: "Your export is being generated. You'll be notified when it's ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "exports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (!selectedProjectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project before exporting.",
        variant: "destructive",
      });
      return;
    }

    exportMutation.mutate({
      projectId: selectedProjectId,
      format: exportFormat,
      ...exportOptions,
      dateFrom: dateRange.from || undefined,
      dateTo: dateRange.to || undefined,
    });
  };

  const formatOptions = [
    {
      value: "csv" as const,
      label: "CSV",
      icon: "fas fa-file-csv",
      description: "Spreadsheet format",
      color: "text-primary",
    },
    {
      value: "excel" as const,
      label: "Excel",
      icon: "fas fa-file-excel",
      description: "Microsoft Excel",
      color: "text-green-600",
    },
    {
      value: "json" as const,
      label: "JSON",
      icon: "fas fa-code",
      description: "Structured data",
      color: "text-yellow-600",
    },
    {
      value: "cypher" as const,
      label: "Cypher",
      icon: "fas fa-database",
      description: "Neo4j import",
      color: "text-blue-600",
    },
  ];

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
                <SelectValue placeholder="Choose a project to export" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-secondary mb-6">Export Data</h3>
            
            <div className="space-y-6">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExportFormat(option.value)}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        exportFormat === option.value
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-primary hover:bg-blue-50"
                      }`}
                    >
                      <i className={`${option.icon} ${option.color} text-2xl mb-2`}></i>
                      <p className="font-medium text-secondary">{option.label}</p>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Data Selection</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeContent}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, includeContent: !!checked }))
                      }
                    />
                    <span className="text-sm text-gray-700">Document content</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeRelationships}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, includeRelationships: !!checked }))
                      }
                    />
                    <span className="text-sm text-gray-700">Entity relationships</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeImages}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, includeImages: !!checked }))
                      }
                    />
                    <span className="text-sm text-gray-700">Image URLs</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.metadataOnly}
                      onCheckedChange={(checked) =>
                        setExportOptions(prev => ({ ...prev, metadataOnly: !!checked }))
                      }
                    />
                    <span className="text-sm text-gray-700">Metadata only</span>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleExport} 
                className="w-full"
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating Export
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Generate Export
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary">Export History</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                Clear History
              </Button>
            </div>
            
            {exportsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-gray-500">Loading exports...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {exports?.map((exportItem: any) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <i className={`fas fa-file-${exportItem.format} text-green-600`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-secondary">{exportItem.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {exportItem.fileSize ? `${(exportItem.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Calculating...'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {exportItem.createdAt ? new Date(exportItem.createdAt).toLocaleDateString() : 'Processing...'}
                        </p>
                      </div>
                    </div>
                    {exportItem.status === 'ready' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => window.open(`/api/exports/${exportItem.id}/download`, '_blank')}
                      >
                        <i className="fas fa-download"></i>
                      </Button>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {exportItem.status === 'generating' ? 'Generating...' : 'Failed'}
                      </div>
                    )}
                  </div>
                ))}

                {!exports || exports.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-download text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No exports yet</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-download text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project above to export its data</p>
        </div>
      )}
    </div>
  );
}
