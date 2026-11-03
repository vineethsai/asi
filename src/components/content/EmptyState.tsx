/**
 * EmptyState — consistent "nothing here" block for lists, filters and charts.
 *
 * Props:
 *   icon?: LucideIcon | string (icon-registry key) | ReactNode   — default "search"-like help glyph
 *   title: ReactNode
 *   description?: ReactNode
 *   action?: ReactNode | { label: string; onClick?: () => void; href?: string }
 *   compact?: boolean       — smaller padding for use inside cards / charts
 *
 * Usage:
 *   <EmptyState icon="filter" title="No threats match" description="Try clearing a filter."
 *     action={{ label: "Clear filters", onClick: reset }} />
 */

import { isValidElement, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SearchX, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon | string | ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode | EmptyStateAction;
  compact?: boolean;
  className?: string;
}

function isAction(a: unknown): a is EmptyStateAction {
  return !!a && typeof a === "object" && !isValidElement(a) && "label" in (a as object);
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const isComponent =
    typeof icon === "function" ||
    (!!icon && typeof icon === "object" && !isValidElement(icon) && "render" in icon);
  let iconNode: ReactNode;
  if (icon != null && !isComponent && typeof icon !== "string") {
    iconNode = icon as ReactNode;
  } else {
    const Cmp: LucideIcon =
      typeof icon === "string"
        ? getIcon(icon, SearchX)
        : isComponent
          ? (icon as LucideIcon)
          : SearchX;
    iconNode = <Cmp aria-hidden className={compact ? "h-5 w-5" : "h-6 w-6"} />;
  }

  let actionNode: ReactNode = null;
  if (isAction(action)) {
    actionNode = action.href ? (
      <Button asChild variant="outline" size="sm">
        {action.href.startsWith("/") ? (
          <Link to={action.href}>{action.label}</Link>
        ) : (
          <a href={action.href} target="_blank" rel="noopener noreferrer">
            {action.label}
          </a>
        )}
      </Button>
    ) : (
      <Button variant="outline" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    );
  } else if (action) {
    actionNode = action as ReactNode;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          compact ? "h-9 w-9" : "h-12 w-12",
        )}
      >
        {iconNode}
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actionNode && <div className="mt-1">{actionNode}</div>}
    </div>
  );
}

export default EmptyState;
