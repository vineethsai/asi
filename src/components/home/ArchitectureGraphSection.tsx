import { HierarchicalArchitectureNavigator } from "@/components/architecture/ArchitectureNavigator";

export const ArchitectureGraphSection = () => {
  return (
    <section className="w-full py-12 lg:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Architecture Explorer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Interactive visualization of AI agent architectures and NIST AI RMF mapping.
          </p>
        </div>

        <div
          className="relative border rounded-lg overflow-hidden bg-card"
          style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}
        >
          <div className="absolute inset-0">
            <HierarchicalArchitectureNavigator />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Click nodes to expand or collapse. Drag to pan, scroll to zoom.
        </p>
      </div>
    </section>
  );
};

export default ArchitectureGraphSection;
