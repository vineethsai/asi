import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mitigationsData, threatsData, Mitigation, Threat } from "../components/components/securityData";
import Header from "@/components/layout/Header";
import SidebarNav from "../components/layout/SidebarNav";
import { frameworkData } from "../components/components/frameworkData";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

export const ControlDetail = () => {
  const { controlId } = useParams<{ controlId: string }>();
  const mitigation: Mitigation | undefined = controlId ? mitigationsData[controlId] : undefined;
  const threats: Threat[] = mitigation
    ? mitigation.threatIds.map(id => threatsData[id]).filter(Boolean)
    : [];

  // Helper to map component IDs to names
  const componentIdToName: Record<string, string> = Object.fromEntries(
    frameworkData.map((c) => [c.id, c.title])
  );

  // Helper to extract code blocks and prose from a section
  function splitProseAndCode(content: string) {
    // Only split on triple-backtick code blocks
    const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
    let parts: { type: 'code' | 'prose', value: string, lang?: string }[] = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'prose', value: content.slice(lastIndex, match.index) });
      }
      const lang = match[1] || '';
      const code = match[2];
      parts.push({ type: 'code', value: code.trim(), lang });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'prose', value: content.slice(lastIndex) });
    }
    return parts.filter(p => p.value.trim() !== '');
  }

  function renderSectionContent(content: string, sectionId: string) {
    const lines = content.split("\n").filter(l => l.trim() !== "");
    // If all lines start with '-', render as a list
    if (lines.length > 1 && lines.every(l => l.trim().startsWith("- "))) {
      return (
        <ul className="list-disc pl-6 text-sm text-muted-foreground">
          {lines.map((l, i) => <li key={i}>{l.replace(/^\s*-\s*/, "")}</li>)}
        </ul>
      );
    }
    // If a single line contains multiple ' - ', render as a list
    if (lines.length === 1 && (content.match(/ - /g) || []).length > 1) {
      const items = content.split(/ - /).map(s => s.trim()).filter(Boolean);
      return (
        <ul className="list-disc pl-6 text-sm text-muted-foreground">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    }
    // Otherwise, split prose and code
    const parts = splitProseAndCode(content);
    if (parts.length === 1 && parts[0].type === 'prose') {
      return <div className="prose prose-sm max-w-none text-muted-foreground"><ReactMarkdown>{parts[0].value.trim()}</ReactMarkdown></div>;
    }
    // If multiple code blocks, use tabs
    const codeBlocks = parts.filter(p => p.type === 'code');
    if (codeBlocks.length > 1) {
      return (
        <Tabs defaultValue={codeBlocks[0].lang || 'code'} className="w-full mt-2">
          <TabsList>
            {codeBlocks.map((block, i) => (
              <TabsTrigger key={i} value={block.lang || `code${i}`}>{`Code ${i+1}`}</TabsTrigger>
            ))}
          </TabsList>
          {codeBlocks.map((block, i) => (
            <TabsContent key={i} value={block.lang || `code${i}`}> 
              <div className="relative">
                <SyntaxHighlighter language={block.lang} style={duotoneLight} customStyle={{ borderRadius: 8, fontSize: 13, padding: 16 }}>
                  {block.value}
                </SyntaxHighlighter>
                <CopyToClipboard text={block.value}>
                  <button className="absolute top-2 right-2 bg-muted px-2 py-1 rounded text-xs border hover:bg-accent">Copy</button>
                </CopyToClipboard>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      );
    }
    // Otherwise, render prose and code blocks sequentially
    return (
      <div className="space-y-4">
        {parts.map((part, i) =>
          part.type === 'prose' ? (
            <div key={i} className="prose prose-sm max-w-none text-muted-foreground"><ReactMarkdown>{part.value.trim()}</ReactMarkdown></div>
          ) : (
            <div key={i} className="relative">
              <SyntaxHighlighter language={part.lang} style={duotoneLight} customStyle={{ borderRadius: 8, fontSize: 13, padding: 16 }}>
                {part.value}
              </SyntaxHighlighter>
              <CopyToClipboard text={part.value}>
                <button className="absolute top-2 right-2 bg-muted px-2 py-1 rounded text-xs border hover:bg-accent">Copy</button>
              </CopyToClipboard>
            </div>
          )
        )}
      </div>
    );
  }

  if (!mitigation) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Control Not Found</h1>
        <Link to="/controls">
          <Button>Back to Controls</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <SidebarNav type="controls" activeId={mitigation.id} />
            <div className="flex-1">
              <Link to="/controls" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Controls
              </Link>
              {/* Overview (full width) */}
              <Card className="mb-4 border border-control/20">
                <CardContent className="p-4">
                  <h1 className="text-2xl font-bold mb-2">{mitigation.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mitigation.designPhase && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Design Phase</span>
                    )}
                    {mitigation.buildPhase && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Build Phase</span>
                    )}
                    {mitigation.operationPhase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Operation Phase</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2">{mitigation.description}</p>
                </CardContent>
              </Card>
              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Design Phase */}
                {mitigation.implementationDetail.design && mitigation.implementationDetail.design.trim() && (
                  <div id="design-phase" className="border border-blue-200 rounded-lg bg-white">
                    <div className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-blue-900">Design Phase</h2>
                      {renderSectionContent(mitigation.implementationDetail.design, "design-phase")}
                    </div>
                  </div>
                )}
                {/* Build Phase */}
                {mitigation.implementationDetail.build && mitigation.implementationDetail.build.trim() && (
                  <div id="build-phase" className="border border-yellow-200 rounded-lg bg-white">
                    <div className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-yellow-900">Build Phase</h2>
                      {renderSectionContent(mitigation.implementationDetail.build, "build-phase")}
                    </div>
                  </div>
                )}
                {/* Operation Phase */}
                {mitigation.implementationDetail.operations && mitigation.implementationDetail.operations.trim() && (
                  <div id="operation-phase" className="border border-green-200 rounded-lg bg-white">
                    <div className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-green-900">Operation Phase</h2>
                      {renderSectionContent(mitigation.implementationDetail.operations, "operation-phase")}
                    </div>
                  </div>
                )}
                {/* Tools & Frameworks */}
                {mitigation.implementationDetail.toolsAndFrameworks && mitigation.implementationDetail.toolsAndFrameworks.trim() && (
                  <div id="tools-frameworks" className="border border-purple-200 rounded-lg bg-white">
                    <div className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-purple-900">Tools & Frameworks</h2>
                      {renderSectionContent(mitigation.implementationDetail.toolsAndFrameworks, "tools-frameworks")}
                    </div>
                  </div>
                )}
                {/* Mitigates Threats */}
                <div id="mitigates-threats" className="border border-red-200 rounded-lg bg-white">
                  <div className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-red-900">Mitigates Threats</h2>
                    {threats.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {threats.map(threat => (
                          <li key={threat.id}>
                            <Link to={`/threats/${threat.id}`} className="text-threat underline">
                              {threat.code} - {threat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="ml-2 text-muted-foreground">No threats documented.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ControlDetail; 