import { HierarchicalArchitectureNavigator } from "@/components/architecture/ArchitectureNavigator";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";

export const ArchitectureGraphSection = () => {
  return (
    <section className="w-full py-12 lg:py-16 bg-gradient-to-b from-muted/20 to-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Network className="h-4 w-4 mr-2" />
            Interactive Visualization
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Architecture Explorer & NIST Mapping
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Visualize AI agent architectures and explore the revolutionary NIST AI RMF to AISVS mapping 
            with interactive D3.js visualizations
          </p>
        </div>
        
        <div className="mb-8">
          {/* Architecture Explorer */}
          <div>
            <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-hidden" 
                 style={{ 
                   height: 'calc(100vh - 300px)', 
                   minHeight: '600px',
                   background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'
                 }}>
              <div className="absolute inset-0">
                <HierarchicalArchitectureNavigator />
              </div>
            </div>
          </div>
          

        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Click nodes to expand/collapse children
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-700 dark:text-blue-300">
            <Network className="h-4 w-4" />
            Try the advanced NIST mapping for deeper insights
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureGraphSection;
