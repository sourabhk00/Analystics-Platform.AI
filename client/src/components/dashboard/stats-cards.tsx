import { Project } from "@shared/schema";

interface StatsCardsProps {
  projects: Project[];
}

export default function StatsCards({ projects }: StatsCardsProps) {
  const activeProjects = projects.filter(p => p.status === 'running').length;
  const totalUrls = projects.reduce((sum, p) => sum + (p.processedUrls || 0), 0);
  const totalEntities = Math.floor(totalUrls * 6.5); // Estimate
  const totalQueries = Math.floor(activeProjects * 97); // Estimate

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      icon: "fas fa-project-diagram",
      color: "blue",
      change: "+23%",
      changeType: "increase" as const,
    },
    {
      title: "Scraped URLs",
      value: totalUrls.toLocaleString(),
      icon: "fas fa-link",
      color: "green",
      change: `+${Math.floor(totalUrls * 0.1)}`,
      changeType: "increase" as const,
    },
    {
      title: "Graph Entities",
      value: totalEntities.toLocaleString(),
      icon: "fas fa-sitemap",
      color: "orange",
      change: `+${Math.floor(totalEntities * 0.15)}`,
      changeType: "increase" as const,
    },
    {
      title: "Q&A Queries",
      value: totalQueries.toString(),
      icon: "fas fa-question-circle",
      color: "purple",
      change: `+${Math.floor(totalQueries * 0.08)}`,
      changeType: "increase" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-3xl font-bold text-secondary mt-1">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 bg-${stat.color}-50 rounded-lg flex items-center justify-center`}>
              <i className={`${stat.icon} text-${stat.color}-500 text-xl`}></i>
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <i className="fas fa-arrow-up text-success mr-1"></i>
            <span className="text-success font-medium">{stat.change}</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}
