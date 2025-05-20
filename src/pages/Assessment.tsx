
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AssessmentTool from "@/components/assessment/AssessmentTool";

const Assessment = () => {
  return (
    <>
      <Header />
      <main className="container py-12">
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Architecture Security Assessment</h1>
          <p className="text-muted-foreground">
            Use this interactive tool to evaluate security risks and controls 
            for your specific agentic AI architecture and components.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <AssessmentTool />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Assessment;
