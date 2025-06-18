import { HierarchicalArchitectureNavigator } from "@/components/architecture/ArchitectureNavigator";

export const ArchitectureGraphSection = () => {
  return (
    <section className="w-full py-12 lg:py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Interactive Architecture Explorer
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Visualize and interact with different AI agent architectures and their security considerations
          </p>
        </div>
        
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-hidden" 
             style={{ 
               height: 'calc(100vh - 200px)', 
               minHeight: '700px',
               background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'
             }}>
          <div className="absolute inset-0">
            <HierarchicalArchitectureNavigator />
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Click on any node to expand/collapse its children
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureGraphSection;
