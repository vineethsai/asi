
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
      <main className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Agentic AI Components</h1>
          <p className="text-muted-foreground">
            Explore the essential components of agentic AI systems and their security implications
          </p>
        </div>
        
        <div className="mb-8 mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search components, threats, or controls..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mb-8 flex justify-center gap-4">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <Plus className="mr-1 h-4 w-4" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            <Minus className="mr-1 h-4 w-4" />
            Collapse All
          </Button>
          <Link to="/assessment">
            <Button size="sm">Start Assessment</Button>
          </Link>
        </div>
        
        <div className="mt-8 w-full">
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
