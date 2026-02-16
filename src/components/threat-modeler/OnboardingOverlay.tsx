import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MousePointer, Zap, Shield, Download, Keyboard } from "lucide-react";

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

const steps = [
  {
    icon: MousePointer,
    title: "Drag & Drop",
    description:
      "Drag components from the left palette onto the canvas to build your architecture.",
  },
  {
    icon: Zap,
    title: "Connect Components",
    description:
      "Click and drag from one handle to another to create data flows between components.",
  },
  {
    icon: Shield,
    title: "Run Analysis",
    description:
      'Click "Analyze" or enable Live mode to automatically detect threats using MAESTRO 7-layer analysis.',
  },
  {
    icon: Download,
    title: "Export Results",
    description: "Export your threat model as JSON, PNG, CSV, Markdown, or SARIF format.",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description: "Press ? for shortcuts. Del to delete, Ctrl+Z to undo, Ctrl+E to analyze.",
  },
];

export default function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-background rounded-xl border shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-sm font-bold">Getting Started with Threat Modeler</h2>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 text-center">
          {(() => {
            const StepIcon = steps[step].icon;
            return (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
            );
          })()}
          <h3 className="font-semibold text-base">{steps[step].title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{steps[step].description}</p>
        </div>
        <div className="flex items-center justify-between p-4 border-t bg-accent/20">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={onDismiss}>
                Start Building
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
