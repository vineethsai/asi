/**
 * SegmentedControl — single-choice segmented buttons on Radix ToggleGroup (type="single":
 * role="radiogroup" with arrow-key roving focus; items are role="radio"). A selection can never be
 * cleared (Radix reports "" when the active item is pressed again; that is ignored).
 *
 * Props:
 *   value; onValueChange(value)
 *   options: { value; label; ariaLabel?; title? }[]
 *   "aria-label" | "aria-labelledby" — name of the group (required for a11y)
 *   size?: "sm" | "md" (default "sm"); fullWidth?: boolean
 */
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Accessible name of the segment when `label` alone is ambiguous (e.g. "Full (1)"). */
  ariaLabel?: string;
  title?: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "sm",
  fullWidth = false,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v as T);
      }}
      className={cn(
        "inline-flex items-stretch gap-0.5 rounded-lg border bg-muted/50 p-0.5",
        fullWidth && "flex w-full",
        className,
      )}
      {...aria}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          aria-label={o.ariaLabel}
          title={o.title}
          className={cn(
            "inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-md font-medium text-muted-foreground transition-colors",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-3 text-sm",
            fullWidth && "flex-1",
          )}
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
