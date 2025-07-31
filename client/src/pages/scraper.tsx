import { useState } from "react";
import ScraperForm from "@/components/scraper/scraper-form";
import ProgressMonitor from "@/components/scraper/progress-monitor";
import ActivityFeed from "@/components/scraper/activity-feed";

export default function Scraper() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <ScraperForm onProjectStart={setActiveProjectId} />
        {activeProjectId && <ProgressMonitor projectId={activeProjectId} />}
      </div>
      
      <div className="space-y-6">
        <ActivityFeed projectId={activeProjectId} />
        
        {/* Quick Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-secondary mb-6">Quick Templates</h3>
          
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <i className="fas fa-wikipedia-w text-blue-600"></i>
                <div>
                  <p className="font-medium text-secondary">Wikipedia Scraper</p>
                  <p className="text-sm text-gray-500">Optimized for Wikipedia articles</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <i className="fas fa-newspaper text-orange-600"></i>
                <div>
                  <p className="font-medium text-secondary">News Sites</p>
                  <p className="text-sm text-gray-500">Extract articles and metadata</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors">
              <div className="flex items-center space-x-3">
                <i className="fas fa-shopping-cart text-green-600"></i>
                <div>
                  <p className="font-medium text-secondary">E-commerce</p>
                  <p className="text-sm text-gray-500">Product information and reviews</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
