import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Assessment from "./pages/Assessment";
import Components from "./pages/Components";
import ComponentDetail from "./pages/ComponentDetail";
import Threats from "./pages/Threats";
import ThreatDetail from "./pages/ThreatDetail";
import Controls from "./pages/Controls";
import ControlDetail from "./pages/ControlDetail";
import Architectures from "./pages/Architectures";
import ArchitectureDetail from "./pages/ArchitectureDetail";
import ScrollToTop from "@/components/layout/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/components" element={<Components />} />
          <Route path="/components/:componentId" element={<ComponentDetail />} />
          <Route path="/threats" element={<Threats />} />
          <Route path="/threats/:threatId" element={<ThreatDetail />} />
          <Route path="/controls" element={<Controls />} />
          <Route path="/controls/:controlId" element={<ControlDetail />} />
          <Route path="/architectures" element={<Architectures />} />
          <Route path="/architectures/:architectureId" element={<ArchitectureDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
