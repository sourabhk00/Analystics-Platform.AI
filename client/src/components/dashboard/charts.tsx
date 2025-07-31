import { Project } from "@shared/schema";
import { useEffect, useRef } from "react";

interface ChartsProps {
  projects: Project[];
}

export default function Charts({ projects }: ChartsProps) {
  const activityChartRef = useRef<HTMLCanvasElement>(null);
  const entityChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize charts when Chart.js is available
    const initCharts = async () => {
      try {
        // Dynamically import Chart.js
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);

        // Activity Chart
        if (activityChartRef.current) {
          const activityData = projects.map(p => p.processedUrls || 0).slice(0, 7);
          
          new Chart(activityChartRef.current, {
            type: 'line',
            data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                label: 'URLs Scraped',
                data: activityData.length ? activityData : [120, 190, 300, 250, 200, 180, 220],
                borderColor: '#1976D2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                tension: 0.4,
                fill: true,
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0,0,0,0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }
          });
        }

        // Entity Distribution Chart
        if (entityChartRef.current) {
          new Chart(entityChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['Persons', 'Organizations', 'Locations', 'Events'],
              datasets: [{
                data: [2347, 892, 1456, 234],
                backgroundColor: ['#1976D2', '#4CAF50', '#FF9800', '#9C27B0'],
                borderWidth: 0,
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                  }
                }
              },
              cutout: '60%',
            }
          });
        }
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
      }
    };

    initCharts();
  }, [projects]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary">Scraping Activity</h3>
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        <div className="relative h-64">
          <canvas ref={activityChartRef} className="w-full h-full"></canvas>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary">Entity Types Distribution</h3>
          <button className="text-sm text-primary hover:text-blue-700 font-medium">View Details</button>
        </div>
        <div className="relative h-64 flex items-center justify-center">
          <canvas ref={entityChartRef} className="max-w-full max-h-full"></canvas>
        </div>
      </div>
    </div>
  );
}
