/**
 * Bottom sheet (P3-30): a Radix Dialog styled as a sheet with a drag handle,
 * used below `lg` for the palette, the results and the property panel.
 * Focus trap, Escape and outside-tap dismissal come from Radix.
 */
import type { ReactNode } from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Max height as a CSS length; default 75dvh. */
  height?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  height = "75dvh",
  className,
}: BottomSheetProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <D.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t bg-background shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            className,
          )}
          style={{ maxHeight: height, height }}
        >
          <div className="flex shrink-0 flex-col items-center pt-2">
            <span aria-hidden className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-1">
            <div className="min-w-0">
              <D.Title className="text-sm font-semibold">{title}</D.Title>
              {description ? (
                <D.Description className="text-xs text-muted-foreground">
                  {description}
                </D.Description>
              ) : (
                <D.Description className="sr-only">{title}</D.Description>
              )}
            </div>
            <D.Close
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Close ${title}`}
            >
              <X className="h-4 w-4" />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export default BottomSheet;
