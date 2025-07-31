import { useQuery } from "@tanstack/react-query";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import { useState, useEffect } from "react";

interface ProgressMonitorProps {
  projectId: string;
}

interface ProgressData {
  processedUrls: number;
  successfulUrls: number;
  failedUrls: number;
  totalUrls: number;
  status: string;
}

export default function ProgressMonitor({ projectId }: ProgressMonitorProps) {
  const [progress, setProgress] = useState<ProgressData>({
    processedUrls: 0,
    successfulUrls: 0,
    failedUrls: 0,
    totalUrls: 0,
    status: 'pending',
  });

  const { data: project } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Listen for real-time progress updates
  useWebSocketEvent('scraping_progress', (data) => {
    if (data.projectId === projectId) {
      setProgress(prev => ({
        ...prev,
        processedUrls: data.totalProcessed,
        successfulUrls: data.successCount || prev.successfulUrls,
        failedUrls: data.errorCount || prev.failedUrls,
      }));
    }
  }, [projectId]);

  useWebSocketEvent('scraping_completed', (data) => {
    if (data.projectId === projectId) {
      setProgress(prev => ({ ...prev, status: 'completed' }));
    }
  }, [projectId]);

  useWebSocketEvent('scraping_error', (data) => {
    if (data.projectId === projectId) {
      setProgress(prev => ({ ...prev, status: 'failed' }));
    }
  }, [projectId]);

  // Update progress from project data
  useEffect(() => {
    if (project) {
      setProgress({
        processedUrls: project.processedUrls || 0,
        successfulUrls: project.successfulUrls || 0,
        failedUrls: project.failedUrls || 0,
        totalUrls: project.totalUrls || 0,
        status: project.status || 'pending',
      });
    }
  }, [project]);

  const progressPercentage = progress.totalUrls > 0 
    ? Math.round((progress.processedUrls / progress.totalUrls) * 100)
    : progress.processedUrls > 0 ? 65 : 0; // Estimate if totalUrls not set

  const remainingUrls = Math.max(0, progress.totalUrls - progress.processedUrls);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-secondary mb-6">Scraping Progress</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{progressPercentage}% Complete</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{progress.processedUrls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">URLs Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{progress.successfulUrls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-danger">{progress.failedUrls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Errors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{remainingUrls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Remaining</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              progress.status === 'running' ? 'bg-green-500 animate-pulse' :
              progress.status === 'completed' ? 'bg-green-500' :
              progress.status === 'failed' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {progress.status === 'running' ? 'Scraping in progress...' : 
               progress.status === 'completed' ? 'Scraping completed' :
               progress.status === 'failed' ? 'Scraping failed' :
               'Waiting to start'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
