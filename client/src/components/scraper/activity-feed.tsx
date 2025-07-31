import { useState, useEffect } from "react";
import { useWebSocketEvent } from "@/hooks/use-websocket";

interface ActivityFeedProps {
  projectId: string | null;
}

interface ActivityItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  url?: string;
}

export default function ActivityFeed({ projectId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Listen for real-time activity updates
  useWebSocketEvent('scraping_progress', (data) => {
    if (!projectId || data.projectId !== projectId) return;

    const activity: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: data.status === 'success' ? 'success' : 'error',
      message: data.status === 'success' 
        ? `Successfully scraped: ${data.url}` 
        : `Error scraping: ${data.url}`,
      details: data.message,
      timestamp: new Date(),
      url: data.url,
    };

    setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 items
  }, [projectId]);

  useWebSocketEvent('document_processed', (data) => {
    if (!projectId || data.projectId !== projectId) return;

    const activity: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'info',
      message: `NLP Processing: ${data.document.title}`,
      details: `Processed document with ${data.document.entityCount} entities`,
      timestamp: new Date(),
      url: data.document.url,
    };

    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  useWebSocketEvent('scraping_completed', (data) => {
    if (!projectId || data.projectId !== projectId) return;

    const activity: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'success',
      message: 'Scraping completed successfully',
      details: 'All URLs have been processed',
      timestamp: new Date(),
    };

    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  useWebSocketEvent('scraping_error', (data) => {
    if (!projectId || data.projectId !== projectId) return;

    const activity: ActivityItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'error',
      message: 'Scraping failed',
      details: data.error || 'Unknown error occurred',
      timestamp: new Date(),
    };

    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle text-green-500';
      case 'error':
        return 'fas fa-exclamation-circle text-red-500';
      case 'warning':
        return 'fas fa-exclamation-triangle text-yellow-500';
      default:
        return 'fas fa-info-circle text-blue-500';
    }
  };

  const getActivityDotColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-secondary mb-6">Live Activity</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-stream text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400">Activity will appear here when scraping starts</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityDotColor(activity.type)}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-secondary break-words">{activity.message}</p>
                {activity.details && (
                  <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                )}
                {activity.url && (
                  <p className="text-xs text-gray-400 font-mono truncate mt-1">{activity.url}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(activity.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear button */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setActivities([])}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fas fa-trash mr-1"></i>
            Clear activity
          </button>
        </div>
      )}
    </div>
  );
}
