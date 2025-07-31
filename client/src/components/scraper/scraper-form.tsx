import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScraperFormProps {
  onProjectStart: (projectId: string) => void;
}

export default function ScraperForm({ onProjectStart }: ScraperFormProps) {
  const [config, setConfig] = useState({
    targetUrl: "",
    maxDepth: 3,
    maxWorkers: 20,
    delay: 1000,
    extractEntities: true,
    buildRelationships: true,
    sentimentAnalysis: false,
    topicModeling: false,
  });

  const { toast } = useToast();

  const startScrapingMutation = useMutation({
    mutationFn: async (scrapingConfig: typeof config) => {
      const response = await apiRequest("POST", "/api/scrape/start", scrapingConfig);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Scraping Started",
        description: "Your web scraping project has been started successfully.",
      });
      onProjectStart(data.projectId);
    },
    onError: (error: Error) => {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.targetUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a target URL to scrape.",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(config.targetUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    startScrapingMutation.mutate(config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-secondary mb-6">Scraping Configuration</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target URL</label>
          <div className="flex space-x-3">
            <Input
              type="url"
              placeholder="https://example.com"
              value={config.targetUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, targetUrl: e.target.value }))}
              className="flex-1"
              required
            />
            <Button type="button" variant="outline" size="icon">
              <i className="fas fa-magic"></i>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Enter the base URL to start scraping from</p>
        </div>

        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Depth</label>
            <Select 
              value={config.maxDepth.toString()} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, maxDepth: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Level</SelectItem>
                <SelectItem value="2">2 Levels</SelectItem>
                <SelectItem value="3">3 Levels</SelectItem>
                <SelectItem value="4">4 Levels</SelectItem>
                <SelectItem value="5">5 Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workers</label>
            <Select 
              value={config.maxWorkers.toString()} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, maxWorkers: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Workers</SelectItem>
                <SelectItem value="20">20 Workers</SelectItem>
                <SelectItem value="30">30 Workers</SelectItem>
                <SelectItem value="50">50 Workers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delay (ms)</label>
            <Input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={config.delay}
              onChange={(e) => setConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {/* NLP Processing Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">NLP Processing</label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.extractEntities}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, extractEntities: !!checked }))}
              />
              <span className="text-sm text-gray-700">Extract entities (Person, Organization, Location)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.buildRelationships}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, buildRelationships: !!checked }))}
              />
              <span className="text-sm text-gray-700">Build relationship graph</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.sentimentAnalysis}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sentimentAnalysis: !!checked }))}
              />
              <span className="text-sm text-gray-700">Sentiment analysis</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.topicModeling}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, topicModeling: !!checked }))}
              />
              <span className="text-sm text-gray-700">Topic modeling</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            type="submit" 
            disabled={startScrapingMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
          >
            {startScrapingMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Starting...
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>
                Start Scraping
              </>
            )}
          </Button>
          <Button type="button" variant="outline">
            Save Template
          </Button>
        </div>
      </form>
    </div>
  );
}
