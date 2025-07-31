import { Project } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecentProjectsProps {
  projects: Project[];
}

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  running: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const statusIcons = {
  pending: "fas fa-clock",
  running: "fas fa-spinner fa-spin",
  completed: "fas fa-check",
  failed: "fas fa-exclamation-triangle",
};

export default function RecentProjects({ projects }: RecentProjectsProps) {
  const recentProjects = projects.slice(0, 5);

  if (recentProjects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-secondary mb-6">Recent Projects</h3>
        <div className="text-center py-8">
          <i className="fas fa-folder-open text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
          <Button className="mt-4">
            <i className="fas fa-plus mr-2"></i>
            Create Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary">Recent Projects</h3>
        <button className="text-sm text-primary hover:text-blue-700 font-medium">View All</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Project Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Domain</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">URLs Scraped</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Last Updated</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <i className="fas fa-folder text-white text-sm"></i>
                    </div>
                    <span className="font-medium text-secondary">{project.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">{project.domain}</td>
                <td className="py-4 px-4">
                  <Badge className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status as keyof typeof statusColors]}`}>
                    <i className={`${statusIcons[project.status as keyof typeof statusIcons]} mr-1`}></i>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-gray-600">{(project.processedUrls || 0).toLocaleString()}</td>
                <td className="py-4 px-4 text-gray-600">
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
