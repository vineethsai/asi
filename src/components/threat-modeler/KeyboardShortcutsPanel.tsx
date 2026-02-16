import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save model" },
      { keys: ["Ctrl", "E"], description: "Run threat analysis" },
      { keys: ["Ctrl", "A"], description: "Select all nodes" },
      { keys: ["Esc"], description: "Deselect / close panel" },
      { keys: ["?"], description: "Show onboarding overlay" },
      { keys: ["Ctrl", "Shift", "?"], description: "Keyboard shortcuts" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Y"], description: "Redo" },
      { keys: ["Ctrl", "D"], description: "Duplicate selected node" },
      { keys: ["Ctrl", "C"], description: "Copy selected node" },
      { keys: ["Ctrl", "V"], description: "Paste copied node" },
      { keys: ["Del / ⌫"], description: "Delete selected" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["+"], description: "Zoom in" },
      { keys: ["-"], description: "Zoom out" },
      { keys: ["Ctrl", "0"], description: "Fit view" },
      { keys: ["Space"], description: "Fit view" },
    ],
  },
];

export default function KeyboardShortcutsPanel({ open, onClose }: KeyboardShortcutsPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-background border rounded-xl shadow-xl w-[380px] max-h-[500px] overflow-hidden flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="p-3 overflow-y-auto space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                    <div className="flex items-center gap-0.5">
                      {s.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono font-semibold">
                            {key}
                          </kbd>
                          {j < s.keys.length - 1 && (
                            <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t text-center">
          <p className="text-[9px] text-muted-foreground">Press Esc to close</p>
        </div>
      </div>
    </div>
  );
}
