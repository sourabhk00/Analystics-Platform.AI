import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/qa/chat-interface";
import QASettings from "@/components/qa/qa-settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QAEngine() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [qaSettings, setQASettings] = useState({
    model: "gpt-4",
    temperature: 0.3,
    contextWindow: 10,
    includeSourceCitations: true,
    generateFollowUpQuestions: true,
    exportConversations: false,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Select Project</h3>
          <div className="w-64">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project for Q&A" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(projects) && projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedProjectId && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="xl:col-span-2">
            <ChatInterface 
              projectId={selectedProjectId} 
              settings={qaSettings} 
            />
          </div>

          {/* Q&A Settings & Suggestions */}
          <div className="space-y-6">
            <QASettings 
              settings={qaSettings} 
              onSettingsChange={setQASettings} 
            />
          </div>
        </div>
      )}

      {!selectedProjectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-brain text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-secondary mb-2">No Project Selected</h3>
          <p className="text-gray-500">Select a project above to start asking questions about your data</p>
        </div>
      )}
    </div>
  );
}
