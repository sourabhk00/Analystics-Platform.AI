import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  cypherQuery?: string;
  confidence?: number;
}

interface ChatInterfaceProps {
  projectId: string;
  settings: {
    model: string;
    temperature: number;
    contextWindow: number;
    includeSourceCitations: boolean;
    generateFollowUpQuestions: boolean;
    exportConversations: boolean;
  };
}

export default function ChatInterface({ projectId, settings }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [includeGraphContext, setIncludeGraphContext] = useState(true);
  const [generateCypher, setGenerateCypher] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI knowledge assistant. I can help you explore and understand your scraped data through natural language queries. You can ask me questions about entities, relationships, patterns, or specific information in your knowledge graph.

Some example questions you might ask:
• "What are the most connected entities in my data?"
• "Show me relationships between organizations and people"
• "Tell me about Einstein's connections to Princeton University"
• "What patterns do you see in the scraped content?"

How can I help you today?`,
        timestamp: new Date(),
        confidence: 1.0,
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/qa/query", {
        projectId,
        query,
        includeGraphContext,
        generateCypher,
        temperature: settings.temperature,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
        cypherQuery: data.cypherQuery,
        confidence: data.confidence,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.confidence < 0.5) {
        toast({
          title: "Low Confidence Response",
          description: "The AI has low confidence in this response. Please verify the information.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuery.trim() || queryMutation.isPending) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentQuery,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    queryMutation.mutate(currentQuery);
    setCurrentQuery("");
  };

  const formatMessage = (message: ChatMessage) => {
    if (message.role === 'assistant' && message.cypherQuery) {
      const parts = message.content.split('```');
      if (parts.length > 1) {
        return (
          <div className="space-y-3">
            <div className="whitespace-pre-wrap">{parts[0]}</div>
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
              <code>{message.cypherQuery}</code>
            </div>
            {parts[2] && <div className="whitespace-pre-wrap">{parts[2]}</div>}
          </div>
        );
      }
    }
    
    return <div className="whitespace-pre-wrap">{message.content}</div>;
  };

  const suggestedQuestions = [
    "What are the most connected entities?",
    "Show me relationships between organizations and people",
    "Find all entities mentioned in the last 24 hours",
    "Generate a summary of scraped content",
    "What patterns do you see in the data?",
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary">AI Knowledge Assistant</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">Powered by {settings.model}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto mb-6 max-h-96 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
            )}
            
            <div className={`flex-1 ${message.role === 'user' ? 'max-w-xs ml-12' : 'max-w-full mr-12'}`}>
              <div className={`rounded-lg p-4 ${
                message.role === 'user' 
                  ? 'bg-gray-50 text-secondary' 
                  : 'bg-blue-50 text-secondary'
              }`}>
                {formatMessage(message)}
                
                {/* Sources and metadata for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mt-3 space-y-2">
                    {message.sources && message.sources.length > 0 && (
                      <div className="p-3 bg-white rounded border border-blue-200">
                        <p className="text-xs text-gray-600 mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.confidence !== undefined && (
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user text-gray-600 text-sm"></i>
              </div>
            )}
          </div>
        ))}
        
        {queryMutation.isPending && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div className="flex-1 mr-12">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-spinner fa-spin text-gray-500"></i>
                  <span className="text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuery(question)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-gray-200 pt-6">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            type="text"
            placeholder="Ask anything about your scraped data..."
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            className="flex-1"
            disabled={queryMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!currentQuery.trim() || queryMutation.isPending}
          >
            {queryMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={includeGraphContext}
                onCheckedChange={(checked) => setIncludeGraphContext(!!checked)}
              />
              <span>Include graph context</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={generateCypher}
                onCheckedChange={(checked) => setGenerateCypher(!!checked)}
              />
              <span>Generate Cypher queries</span>
            </div>
          </div>
          
          <span className="text-xs text-gray-400">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
