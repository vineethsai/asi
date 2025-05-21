
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus } from "lucide-react";
import ComponentFramework, { ComponentFrameworkHandle } from "@/components/components/ComponentFramework";

const Components = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reference to the ComponentFramework component
  const componentFrameworkRef = useRef<ComponentFrameworkHandle>(null);
  
  const handleExpandAll = () => {
    if (componentFrameworkRef.current) {
      componentFrameworkRef.current.expandAll();
    }
  };
  
  const handleCollapseAll = () => {
    if (componentFrameworkRef.current) {
      componentFrameworkRef.current.collapseAll();
    }
  };
  
  return (
    <>
      <Header />
      <main className="container mx-auto py-16 px-6 max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Agentic AI Components</h1>
          <p className="text-muted-foreground text-lg">
            Explore the essential components of agentic AI systems and their security implications
          </p>
        </div>
        
        <div className="mb-10 mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search components, threats, or controls..." 
              className="pl-12 py-6 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mb-10 flex justify-center gap-4">
          <Button variant="outline" size="lg" onClick={handleExpandAll}>
            <Plus className="mr-2 h-5 w-5" />
            Expand All
          </Button>
          <Button variant="outline" size="lg" onClick={handleCollapseAll}>
            <Minus className="mr-2 h-5 w-5" />
            Collapse All
          </Button>
          <Link to="/assessment">
            <Button size="lg">Start Assessment</Button>
          </Link>
        </div>
        
        <div className="w-full bg-background/50 rounded-xl p-6 shadow-sm">
          <ComponentFramework 
            ref={componentFrameworkRef}
            searchQuery={searchQuery} 
          />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Components;
