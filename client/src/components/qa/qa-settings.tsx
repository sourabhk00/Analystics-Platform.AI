import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface QASettingsProps {
  settings: {
    model: string;
    temperature: number;
    contextWindow: number;
    includeSourceCitations: boolean;
    generateFollowUpQuestions: boolean;
    exportConversations: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function QASettings({ settings, onSettingsChange }: QASettingsProps) {
  const updateSetting = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const suggestedQuestions = [
    "What are the most connected entities in my graph?",
    "Show me relationships between organizations and people",
    "Find all entities mentioned in the last 24 hours",
    "Generate a summary of scraped content",
    "What patterns do you see in the data?",
  ];

  return (
    <div className="space-y-6">
      {/* AI Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-secondary mb-6">AI Settings</h3>
        
        <div className="space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <Select value={settings.model} onValueChange={(value) => updateSetting('model', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5-Turbo</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="llama2">Llama 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 min-w-fit">Conservative</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 min-w-fit">Creative</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Current: {settings.temperature}</p>
          </div>

          {/* Context Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Context Window</label>
            <Select 
              value={settings.contextWindow.toString()} 
              onValueChange={(value) => updateSetting('contextWindow', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Last 5 messages</SelectItem>
                <SelectItem value="10">Last 10 messages</SelectItem>
                <SelectItem value="20">Last 20 messages</SelectItem>
                <SelectItem value="50">Full conversation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response Features */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Response Features</label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.includeSourceCitations}
                onCheckedChange={(checked) => updateSetting('includeSourceCitations', !!checked)}
              />
              <span className="text-sm text-gray-700">Include source citations</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.generateFollowUpQuestions}
                onCheckedChange={(checked) => updateSetting('generateFollowUpQuestions', !!checked)}
              />
              <span className="text-sm text-gray-700">Generate follow-up questions</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.exportConversations}
                onCheckedChange={(checked) => updateSetting('exportConversations', !!checked)}
              />
              <span className="text-sm text-gray-700">Export conversations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-secondary mb-6">Suggested Questions</h3>
        
        <div className="space-y-3">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors"
            >
              <p className="text-sm font-medium text-secondary">{question}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-secondary mb-4">Usage Today</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Questions Asked</span>
            <span className="text-sm font-medium text-secondary">47</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tokens Used</span>
            <span className="text-sm font-medium text-secondary">15,420</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Remaining Limit</span>
            <span className="text-sm font-medium text-success">84,580</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Daily Usage</span>
            <span className="text-gray-600">15.4%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '15.4%' }}></div>
          </div>
        </div>

        <Button variant="outline" className="w-full mt-4">
          <i className="fas fa-chart-bar mr-2"></i>
          View Detailed Usage
        </Button>
      </div>
    </div>
  );
}
