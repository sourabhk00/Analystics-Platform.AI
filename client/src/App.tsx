import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Scraper from "@/pages/scraper";
import KnowledgeGraph from "@/pages/knowledge-graph";
import QAEngine from "@/pages/qa-engine";
import DataManagement from "@/pages/data-management";
import Exports from "@/pages/exports";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import NotFound from "@/pages/not-found";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <TopBar activeTab={activeTab} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function Router() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/scraper" component={Scraper} />
        <Route path="/graph" component={KnowledgeGraph} />
        <Route path="/qa" component={QAEngine} />
        <Route path="/data" component={DataManagement} />
        <Route path="/exports" component={Exports} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
