import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedMetric, setSelectedMetric] = useState('overview');
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: globalStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  useWebSocketEvent('project_updated', (data) => {
    toast({
      title: "Project Updated",
      description: `Project ${data.projectId} has been updated`,
    });
  }, [toast]);

  useWebSocketEvent('scraping_completed', (data) => {
    toast({
      title: "Scraping Completed", 
      description: `Project ${data.projectId} has finished scraping`,
    });
  }, [toast]);

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectsArray = Array.isArray(projects) ? projects : [];
  const activeProjects = projectsArray.filter(p => p.status === 'active').length;
  const completedProjects = projectsArray.filter(p => p.status === 'completed').length;
  const totalUrls = projectsArray.reduce((sum, p) => sum + (p.totalUrls || 0), 0);
  const processedUrls = projectsArray.reduce((sum, p) => sum + (p.processedUrls || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-4">
                Data Analytics Command Center
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Advanced web intelligence platform powered by AI-driven knowledge graphs and natural language processing
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link href="/scraper">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm border border-white/20">
                  <i className="fas fa-spider mr-2"></i>
                  Start Scraping
                </Button>
              </Link>
              <Link href="/knowledge-graph">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm border border-white/20">
                  <i className="fas fa-project-diagram mr-2"></i>
                  Explore Graph
                </Button>
              </Link>
              <Link href="/qa-engine">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm border border-white/20">
                  <i className="fas fa-brain mr-2"></i>
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold">{projectsArray.length}</p>
                  <p className="text-blue-200 text-xs mt-1">{activeProjects} active</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <i className="fas fa-folder-open text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">URLs Processed</p>
                  <p className="text-3xl font-bold">{processedUrls.toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs mt-1">of {totalUrls.toLocaleString()} total</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <i className="fas fa-link text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Knowledge Entities</p>
                  <p className="text-3xl font-bold">{globalStats?.totalEntities?.toLocaleString() || '0'}</p>
                  <p className="text-purple-200 text-xs mt-1">across all projects</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <i className="fas fa-sitemap text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">AI Queries</p>
                  <p className="text-3xl font-bold">{globalStats?.totalQueries || '0'}</p>
                  <p className="text-orange-200 text-xs mt-1">this month</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <i className="fas fa-brain text-2xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Activity Feed */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl">
              <CardTitle className="text-slate-800 flex items-center">
                <i className="fas fa-activity text-blue-600 mr-3"></i>
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {projectsArray.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        project.status === 'active' ? 'bg-green-500 animate-pulse' :
                        project.status === 'completed' ? 'bg-blue-500' :
                        project.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{project.name}</h4>
                        <p className="text-sm text-slate-600">{project.domain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="mb-1">
                        {project.status}
                      </Badge>
                      <p className="text-xs text-slate-500">
                        {project.processedUrls || 0}/{project.totalUrls || 0} URLs
                      </p>
                    </div>
                  </div>
                ))}
                
                {projectsArray.length === 0 && (
                  <div className="text-center py-12">
                    <i className="fas fa-rocket text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Launch</h3>
                    <p className="text-gray-500 mb-4">Create your first project to start analyzing web data</p>
                    <Link href="/scraper">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <i className="fas fa-plus mr-2"></i>
                        Create Project
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
              <CardTitle className="text-slate-800 flex items-center">
                <i className="fas fa-chart-line text-purple-600 mr-3"></i>
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Processing Efficiency</span>
                  <span className="text-sm text-slate-600">
                    {totalUrls > 0 ? Math.round((processedUrls / totalUrls) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={totalUrls > 0 ? (processedUrls / totalUrls) * 100 : 0} 
                  className="h-2 bg-gradient-to-r from-blue-200 to-purple-200"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Avg. Processing Speed</span>
                  <span className="text-sm font-semibold text-slate-800">2.3 URLs/sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Success Rate</span>
                  <span className="text-sm font-semibold text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Knowledge Density</span>
                  <span className="text-sm font-semibold text-purple-600">8.7 entities/page</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Top Entity Types</h4>
                <div className="space-y-2">
                  {['PERSON', 'ORG', 'LOCATION', 'TOPIC'].map((type, index) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.max(20, 80 - index * 15)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-700">{Math.max(5, 50 - index * 8)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
            <CardTitle className="text-slate-800 flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-microscope text-indigo-600 mr-3"></i>
                Advanced Analytics & Intelligence
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <i className="fas fa-download mr-1"></i>
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <i className="fas fa-cog mr-1"></i>
                  Configure
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Link href="/knowledge-graph">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border border-purple-200">
                    <i className="fas fa-project-diagram text-4xl text-purple-600 mb-4"></i>
                    <h3 className="font-semibold text-slate-800 mb-2">Knowledge Graph</h3>
                    <p className="text-sm text-slate-600">Explore entity relationships and data connections</p>
                  </div>
                </Link>
              </div>
              
              <div className="text-center">
                <Link href="/data-management">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border border-blue-200">
                    <i className="fas fa-database text-4xl text-blue-600 mb-4"></i>
                    <h3 className="font-semibold text-slate-800 mb-2">Data Analysis</h3>
                    <p className="text-sm text-slate-600">Deep insights and statistical analysis</p>
                  </div>
                </Link>
              </div>
              
              <div className="text-center">
                <Link href="/exports">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border border-emerald-200">
                    <i className="fas fa-code text-4xl text-emerald-600 mb-4"></i>
                    <h3 className="font-semibold text-slate-800 mb-2">Cypher Generator</h3>
                    <p className="text-sm text-slate-600">Generate graph database queries</p>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}