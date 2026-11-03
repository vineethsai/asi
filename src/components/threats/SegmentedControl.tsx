/**
 * SegmentedControl — single-choice toggle row (Radix ToggleGroup: roving focus, arrow keys).
 *
 *   <SegmentedControl label="Sort by" value={sort} onValueChange={setSort}
 *     options={[{ value: "risk", label: "Risk" }, { value: "name", label: "Name" }]} />
 */
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Show the label visibly before the group (default true). */
  showLabel?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
  showLabel = true,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {showLabel && <span className="text-xs text-muted-foreground">{label}</span>}
      <ToggleGroup.Root
        type="single"
        value={value}
        aria-label={label}
        onValueChange={(v) => v && onValueChange(v as T)}
        className="inline-flex h-9 items-center rounded-md border bg-muted/40 p-0.5"
      >
        {options.map((o) => (
          <ToggleGroup.Item
            key={o.value}
            value={o.value}
            className={cn(
              "inline-flex h-8 items-center rounded px-2.5 text-xs font-medium text-muted-foreground transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            )}
          >
            {o.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}

export default SegmentedControl;
