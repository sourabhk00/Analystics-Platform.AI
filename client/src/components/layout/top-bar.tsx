import { Button } from "@/components/ui/button";

interface TopBarProps {
  activeTab: string;
}

const tabTitles = {
  dashboard: {
    title: "Dashboard Overview",
    subtitle: "Monitor your scraping operations and analytics",
  },
  scraper: {
    title: "Web Scraper",
    subtitle: "Configure and run web scraping operations",
  },
  graph: {
    title: "Knowledge Graph",
    subtitle: "Explore relationships and entities in your data",
  },
  qa: {
    title: "AI Q&A Engine",
    subtitle: "Ask questions about your scraped data",
  },
  data: {
    title: "Data Management",
    subtitle: "View and manage your scraped documents",
  },
  exports: {
    title: "Data Exports",
    subtitle: "Export your data in various formats",
  },
};

export default function TopBar({ activeTab }: TopBarProps) {
  const currentTab = tabTitles[activeTab as keyof typeof tabTitles] || tabTitles.dashboard;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">{currentTab.title}</h2>
          <p className="text-gray-500">{currentTab.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-bell text-lg"></i>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <i className="fas fa-cog text-lg"></i>
          </button>
          <Button className="bg-primary text-white hover:bg-blue-700">
            <i className="fas fa-plus mr-2"></i>
            New Project
          </Button>
        </div>
      </div>
    </header>
  );
}
