import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function DataManagement() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "documents", searchQuery],
    enabled: !!selectedProjectId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "stats"],
    enabled: !!selectedProjectId,
  });

  const handleSearch = () => {
    // The query will automatically refetch when searchQuery changes
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
                <SelectValue placeholder="Choose a project to manage" />
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
        <>
          {/* Data Overview */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Documents</p>
                      <p className="text-3xl font-bold text-secondary mt-1">{stats?.totalDocuments || 0}</p>
                    </div>
                    <i className="fas fa-file-alt text-blue-500 text-2xl"></i>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Entities</p>
                      <p className="text-3xl font-bold text-secondary mt-1">{stats?.totalEntities || 0}</p>
                    </div>
                    <i className="fas fa-sitemap text-green-500 text-2xl"></i>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Relationships</p>
                      <p className="text-3xl font-bold text-secondary mt-1">{stats?.totalRelationships || 0}</p>
                    </div>
                    <i className="fas fa-network-wired text-orange-500 text-2xl"></i>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Entity Types</p>
                      <p className="text-3xl font-bold text-secondary mt-1">
                        {Object.keys(stats.entityTypes || {}).length}
                      </p>
                    </div>
                    <i className="fas fa-tags text-purple-500 text-2xl"></i>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary">Scraped Data</h3>
              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Politics">Politics</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <i className="fas fa-filter mr-2"></i>
                  Filter
                </Button>
              </div>
            </div>

            {documentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-gray-500">Loading documents...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Document</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Word Count</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Entities</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Last Updated</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents?.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-secondary truncate max-w-xs">{doc.title}</p>
                            <p className="text-xs text-gray-500 font-mono truncate max-w-xs">{doc.url}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {doc.category && (
                            <Badge variant="secondary">{doc.category}</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-600">{doc.wordCount || 0}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {Array.isArray(doc.entities) ? doc.entities.length : 0}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" title="View">
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit">
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button variant="ghost" size="sm" title="Delete" className="text-red-500 hover:text-red-700">
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!documents || documents.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-database text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No documents found</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Pagination would go here */}
          </div>
        </>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-database text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project above to manage its scraped data</p>
        </div>
      )}
    </div>
  );
}
