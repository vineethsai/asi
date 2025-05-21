import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { frameworkData } from "@/components/components/frameworkData";

const Components = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {frameworkData.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map(component => (
            <Card key={component.id} className="h-full border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{component.title}</h3>
                  <Link to={`/components/${component.id}`} className="text-muted-foreground underline text-sm">Details</Link>
                </div>
                <p className="text-muted-foreground mb-4">{component.description}</p>
                {component.threatCategories && component.threatCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {component.threatCategories.map((threat, i) => (
                      <span key={i} className="text-xs bg-threat/10 text-threat px-3 py-1 rounded-full font-medium">
                        {threat}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Components;
