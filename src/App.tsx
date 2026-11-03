import React, { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPaletteProvider } from "@/components/layout/CommandPaletteProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { FullscreenSkeleton } from "@/components/layout/Skeletons";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { useTransitionLocation } from "@/components/layout/useRouteTransition";

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
const Interactive = React.lazy(() => import("./pages/Interactive"));
const References = React.lazy(() => import("./pages/References"));
const Implementation = React.lazy(() => import("./pages/Implementation"));
const About = React.lazy(() => import("./pages/About"));
const Taxonomy = React.lazy(() => import("./pages/Taxonomy"));
const ThreatModeler = React.lazy(() => import("./pages/ThreatModeler"));
const ThreatModelerGuide = React.lazy(() => import("./pages/ThreatModelerGuide"));

const AppRoutes = () => {
  useAnalytics();
  const location = useTransitionLocation();

  return (
    <>
      <ScrollToTop pathname={location.pathname} hash={location.hash} />
      <Routes location={location}>
        {/* Full-screen tool with its own chrome. */}
        <Route
          path="/threat-modeler"
          element={
            <Suspense fallback={<FullscreenSkeleton />}>
              <ThreatModeler />
            </Suspense>
          }
        />
        {/* Everything else shares the persistent header (AppShell). */}
        <Route element={<AppShell />}>
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
          <Route path="/cisco-taxonomy" element={<Navigate to="/taxonomy?tab=cisco" replace />} />
          <Route
            path="/owasp-agentic-top10"
            element={<Navigate to="/taxonomy?tab=owasp-agentic" replace />}
          />
          <Route path="/aivss" element={<Navigate to="/taxonomy?tab=aivss" replace />} />
          <Route path="/aiuc-1" element={<Navigate to="/taxonomy?tab=aiuc-1" replace />} />
          <Route path="/implementation" element={<Implementation />} />
          <Route path="/about" element={<About />} />
          <Route path="/threat-modeler-guide" element={<ThreatModelerGuide />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <CommandPaletteProvider>
            <AppRoutes />
          </CommandPaletteProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
