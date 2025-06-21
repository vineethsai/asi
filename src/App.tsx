import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Components from "./pages/Components";
import ComponentDetail from "./pages/ComponentDetail";
import Threats from "./pages/Threats";
import ThreatDetail from "./pages/ThreatDetail";
import Controls from "./pages/Controls";
import ControlDetail from "./pages/ControlDetail";
import Architectures from "./pages/Architectures";
import ArchitectureDetail from "./pages/ArchitectureDetail";
import AISVS from "./pages/AISVS";
import NISTMapping from "./pages/NISTMapping";
import TestNavigator from "./pages/TestNavigator";
import Assessment from "./pages/Assessment";
import Interactive from "./pages/Interactive";
import References from "./pages/References";
import ScrollToTop from "@/components/layout/ScrollToTop";

const queryClient = new QueryClient();

// Analytics wrapper component
const AppWithAnalytics = () => {
  useAnalytics(); // This will track all page views automatically
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/components" element={<Components />} />
      <Route path="/components/:componentId" element={<ComponentDetail />} />
      <Route path="/threats" element={<Threats />} />
      <Route path="/threats/:threatId" element={<ThreatDetail />} />
      <Route path="/controls" element={<Controls />} />
      <Route path="/controls/:controlId" element={<ControlDetail />} />
      <Route path="/architectures" element={<Architectures />} />
      <Route path="/architectures/:architectureId" element={<ArchitectureDetail />} />
      <Route path="/aisvs" element={<AISVS />} />
      <Route path="/nist-mapping" element={<NISTMapping />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/interactive" element={<Interactive />} />
      <Route path="/references" element={<References />} />
      <Route path="/test-navigator" element={<TestNavigator />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <ScrollToTop />
        <AppWithAnalytics />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
