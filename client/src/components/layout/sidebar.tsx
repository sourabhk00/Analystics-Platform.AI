import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  {
    id: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: "fas fa-tachometer-alt",
  },
  {
    id: "scraper",
    path: "/scraper",
    label: "Web Scraper",
    icon: "fas fa-spider",
  },
  {
    id: "graph",
    path: "/graph",
    label: "Knowledge Graph",
    icon: "fas fa-network-wired",
  },
  {
    id: "qa",
    path: "/qa",
    label: "AI Q&A Engine",
    icon: "fas fa-brain",
  },
  {
    id: "data",
    path: "/data",
    label: "Data Management",
    icon: "fas fa-database",
  },
  {
    id: "exports",
    path: "/exports",
    label: "Exports",
    icon: "fas fa-download",
  },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [location] = useLocation();

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-project-diagram text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary">DataGraph</h1>
            <p className="text-sm text-gray-500">Analytics Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => handleNavClick(item)}
            >
              <a
                className={cn(
                  "nav-item flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors",
                  isActive
                    ? "active bg-blue-50 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <i className="fas fa-user text-white text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary truncate">Data Analyst</p>
            <p className="text-xs text-gray-500">Premium Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
