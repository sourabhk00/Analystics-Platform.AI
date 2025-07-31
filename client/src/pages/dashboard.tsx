import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import Charts from "@/components/dashboard/charts";
import RecentProjects from "@/components/dashboard/recent-projects";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Listen for real-time updates
  useWebSocketEvent('scraping_progress', (data) => {
    toast({
      title: "Scraping Progress",
      description: `Processed ${data.totalProcessed} URLs for project ${data.projectId}`,
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards projects={Array.isArray(projects) ? projects : []} />
      <Charts projects={Array.isArray(projects) ? projects : []} />
      <RecentProjects projects={Array.isArray(projects) ? projects : []} />
    </div>
  );
}
