import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "./commandPaletteContext";

export type EntityType = "threat" | "control" | "architecture" | "component";

const META: Record<EntityType, { label: string; plural: string; path: string }> = {
  threat: { label: "Threat", plural: "threats", path: "/threats" },
  control: { label: "Control", plural: "controls", path: "/controls" },
  architecture: { label: "Architecture", plural: "architectures", path: "/architectures" },
  component: { label: "Component", plural: "components", path: "/components" },
};

export interface NotFoundEntityProps {
  type: EntityType;
  /** The id from the URL, echoed back to the user and used to pre-fill search. */
  id?: string;
  /** Overrides the default "{Type} not found" heading (e.g. "Sub-component not found"). */
  title?: string;
}

/**
 * Not-found state for detail routes (IMPROVEMENT_PLAN P0-15). Render it inside
 * `<PageLayout noindex …>` so the header, drawer and footer stay available.
 */
export function NotFoundEntity({ type, id, title }: NotFoundEntityProps) {
  const meta = META[type];
  const { openPalette } = useCommandPalette();

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="mb-2 font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
        {title ?? `${meta.label} not found`}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {id ? (
          <>
            There is no {meta.label.toLowerCase()} with the id{" "}
            <code className="text-foreground">{id}</code>.
          </>
        ) : (
          <>This {meta.label.toLowerCase()} does not exist.</>
        )}{" "}
        It may have been renamed or removed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to={meta.path}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Browse all {meta.plural}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => openPalette(id ?? "")}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Search the site
        </Button>
      </div>
    </div>
  );
}

export default NotFoundEntity;
