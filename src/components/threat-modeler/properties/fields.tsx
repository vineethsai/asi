/**
 * Small form primitives for the property panel (P3-33): collapsible sections
 * with aria-expanded, labelled fields, draft inputs that commit on blur /
 * Enter (Escape reverts), selects, switches, list and node multi-selects.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Open/closed state survives switching between nodes (per section key).
const openState = new Map<string, boolean>();

export function Section({
  id,
  title,
  icon,
  count,
  defaultOpen = true,
  children,
  actions,
}: {
  id: string;
  title: string;
  icon?: ReactNode;
  count?: number | string;
  defaultOpen?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(() => openState.get(id) ?? defaultOpen);
  const contentId = `tm-prop-section-${id}`;
  const toggle = () => {
    openState.set(id, !open);
    setOpen(!open);
  };
  return (
    <section className="border-b last:border-b-0">
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-left text-xs font-semibold hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {icon}
          <span className="truncate">{title}</span>
          {count !== undefined && (
            <span className="ml-1 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </button>
        {actions}
      </div>
      {open && (
        <div id={contentId} className="space-y-3 px-3 pb-3">
          {children}
        </div>
      )}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={htmlFor} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Text input with a local draft; commits on blur / Enter, Escape reverts, commits on unmount if dirty. */
export function DraftInput({
  id,
  value,
  onCommit,
  disabled,
  placeholder,
  type = "text",
  multiline = false,
  ariaLabel,
  className,
}: {
  id?: string;
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: "text" | "url" | "date" | "number";
  multiline?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const latest = useRef({ draft, value, onCommit });
  latest.current = { draft, value, onCommit };
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  useEffect(
    () => () => {
      const l = latest.current;
      if (focused.current && l.draft !== l.value) l.onCommit(l.draft);
    },
    [],
  );
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  const common = {
    id,
    value: draft,
    disabled,
    placeholder,
    "aria-label": ariaLabel,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      commit();
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        setDraft(value);
        return;
      }
      if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    },
  };
  return multiline ? (
    <Textarea {...common} rows={2} className={cn("min-h-[52px] text-xs", className)} />
  ) : (
    <Input {...common} type={type} className={cn("h-8 text-xs", className)} />
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

const NONE = "__none";

/** shadcn Select; `allowNone` adds an "unset" option (Radix forbids empty values). */
export function SelectField<T extends string>({
  id,
  value,
  options,
  onChange,
  disabled,
  allowNone,
  noneLabel = "Not set",
  ariaLabel,
  className,
}: {
  id?: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (value: T | undefined) => void;
  disabled?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <Select
      value={value ?? (allowNone ? NONE : undefined)}
      onValueChange={(v) => onChange(v === NONE ? undefined : (v as T))}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("h-8 text-xs", className)}>
        <SelectValue placeholder={noneLabel} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value={NONE} className="text-xs">
            {noneLabel}
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="mt-0.5 scale-90"
      />
    </div>
  );
}

/** Comma-separated list editor for string[] values, with a chip preview. */
export function ListInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <DraftInput
        id={id}
        value={value.join(", ")}
        disabled={disabled}
        placeholder={placeholder ?? "comma, separated, values"}
        onCommit={(v) =>
          onChange(
            v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span
              key={v}
              className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Checkbox list of nodes (by label) for id-list fields (hitl.protects, memory.writeAccess …). */
export function NodeMultiSelect({
  label,
  options,
  value,
  onChange,
  disabled,
  emptyText = "No other components",
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  emptyText?: string;
}) {
  const base = useId();
  const set = new Set(value);
  return (
    <fieldset className="space-y-1">
      <legend className="text-[11px] font-medium text-muted-foreground">{label}</legend>
      {options.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-1.5">
          {options.map((o) => {
            const id = `${base}-${o.id}`;
            return (
              <div key={o.id} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={set.has(o.id)}
                  disabled={disabled}
                  onCheckedChange={(c) =>
                    onChange(c ? [...value, o.id] : value.filter((x) => x !== o.id))
                  }
                />
                <Label htmlFor={id} className="truncate text-xs font-normal">
                  {o.label}
                </Label>
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

/** Key/value editor for `customMetadata` (commits the whole map). */
export function KeyValueEditor({
  value,
  onChange,
  disabled,
  hiddenKeys = [],
}: {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
  hiddenKeys?: string[];
}) {
  const [newKey, setNewKey] = useState("");
  const entries = Object.entries(value).filter(([k]) => !hiddenKeys.includes(k));
  const add = () => {
    const k = newKey.trim();
    if (!k || k in value) return;
    onChange({ ...value, [k]: "" });
    setNewKey("");
  };
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className="w-24 shrink-0 truncate font-mono text-[11px]" title={k}>
            {k}
          </span>
          <DraftInput
            value={v}
            ariaLabel={`Value of ${k}`}
            disabled={disabled}
            onCommit={(nv) => onChange({ ...value, [k]: nv })}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = { ...value };
              delete next[k];
              onChange(next);
            }}
            className="rounded px-1.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            aria-label={`Remove ${k}`}
          >
            ✕
          </button>
        </div>
      ))}
      {!disabled && (
        <div className="flex items-center gap-1.5">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="New key"
            aria-label="New metadata key"
            className="h-7 text-xs"
          />
          <button
            type="button"
            onClick={add}
            className="shrink-0 rounded border px-2 py-1 text-[11px] hover:bg-accent"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
