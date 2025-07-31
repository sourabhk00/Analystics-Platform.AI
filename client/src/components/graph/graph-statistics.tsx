interface GraphStatisticsProps {
  graphData: any;
}

export default function GraphStatistics({ graphData }: GraphStatisticsProps) {
  if (!graphData || !graphData.statistics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-secondary mb-4">Graph Statistics</h3>
        <div className="text-center py-4">
          <p className="text-gray-500">No statistics available</p>
        </div>
      </div>
    );
  }

  const stats = graphData.statistics;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-secondary mb-4">Graph Statistics</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total Nodes</span>
          <span className="text-sm font-medium text-secondary">{stats.nodeCount?.toLocaleString() || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total Edges</span>
          <span className="text-sm font-medium text-secondary">{stats.edgeCount?.toLocaleString() || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Connected Components</span>
          <span className="text-sm font-medium text-secondary">{stats.connectedComponents || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Average Degree</span>
          <span className="text-sm font-medium text-secondary">{stats.averageDegree || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Graph Density</span>
          <span className="text-sm font-medium text-secondary">{stats.density || 0}</span>
        </div>
      </div>

      {/* Entity Type Distribution */}
      {graphData.statistics?.entityTypes && Object.keys(graphData.statistics.entityTypes).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Entity Types</h4>
          <div className="space-y-2">
            {Object.entries(graphData.statistics.entityTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((count as number) / (stats.nodeCount || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-secondary w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Type Distribution */}
      {graphData.statistics?.relationshipTypes && Object.keys(graphData.statistics.relationshipTypes).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Relationship Types</h4>
          <div className="space-y-2">
            {Object.entries(graphData.statistics.relationshipTypes).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-xs text-gray-600 truncate max-w-20" title={type}>
                  {type.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((count as number) / (stats.edgeCount || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-secondary w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graph Health Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Graph Health</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              (stats.connectedComponents || 0) <= 5 ? 'bg-green-500' : 
              (stats.connectedComponents || 0) <= 10 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {(stats.connectedComponents || 0) <= 5 ? 'Well Connected' : 
               (stats.connectedComponents || 0) <= 10 ? 'Moderately Connected' : 'Fragmented'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              (stats.density || 0) > 0.3 ? 'bg-green-500' : 
              (stats.density || 0) > 0.1 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {(stats.density || 0) > 0.3 ? 'Dense Graph' : 
               (stats.density || 0) > 0.1 ? 'Moderate Density' : 'Sparse Graph'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
