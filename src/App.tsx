import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Components = React.lazy(() => import("./pages/Components"));
const ComponentDetail = React.lazy(() => import("./pages/ComponentDetail"));
const Threats = React.lazy(() => import("./pages/Threats"));
const ThreatDetail = React.lazy(() => import("./pages/ThreatDetail"));
const Controls = React.lazy(() => import("./pages/Controls"));
const ControlDetail = React.lazy(() => import("./pages/ControlDetail"));
const Architectures = React.lazy(() => import("./pages/Architectures"));
const ArchitectureDetail = React.lazy(() => import("./pages/ArchitectureDetail"));
const AISVS = React.lazy(() => import("./pages/AISVS"));
const NISTMapping = React.lazy(() => import("./pages/NISTMapping"));
const TestNavigator = React.lazy(() => import("./pages/TestNavigator"));
const Interactive = React.lazy(() => import("./pages/Interactive"));
const References = React.lazy(() => import("./pages/References"));
const Implementation = React.lazy(() => import("./pages/Implementation"));
const About = React.lazy(() => import("./pages/About"));
const Taxonomy = React.lazy(() => import("./pages/Taxonomy"));
const ThreatModeler = React.lazy(() => import("./pages/ThreatModeler"));

import ScrollToTop from "@/components/layout/ScrollToTop";

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const AppWithAnalytics = () => {
  useAnalytics();

  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/interactive" element={<Interactive />} />
        <Route path="/references" element={<References />} />
        <Route path="/taxonomy" element={<Taxonomy />} />
        <Route path="/mitre-atlas" element={<Navigate to="/taxonomy?tab=mitre-atlas" replace />} />
        <Route path="/cisco-taxonomy" element={<Navigate to="/taxonomy?tab=cisco" replace />} />
        <Route
          path="/owasp-agentic-top10"
          element={<Navigate to="/taxonomy?tab=owasp-agentic" replace />}
        />
        <Route path="/aivss" element={<Navigate to="/taxonomy?tab=aivss" replace />} />
        <Route path="/implementation" element={<Implementation />} />
        <Route path="/about" element={<About />} />
        <Route path="/test-navigator" element={<TestNavigator />} />
        <Route path="/threat-modeler" element={<ThreatModeler />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AppWithAnalytics />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
