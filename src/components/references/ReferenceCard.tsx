/**
 * One reference in the library: title link, domain label (text — no favicons), type badge,
 * "cited by" chips linking back to the citing threat / control / AISVS chapter / ASI entry,
 * and, for standards and papers, a "Cite" panel with plain-text and BibTeX citations.
 */
import { memo, useId, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ExternalLink, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/aisvs/Highlight";
import { copyToClipboard } from "@/components/aisvs/exportProgress";
import { Icon } from "@/lib/icons";
import {
  CITING_KINDS,
  REFERENCE_TYPES,
  formatBibtex,
  formatCitation,
  isWebUrl,
  type Citation,
  type ReferenceEntry,
} from "./referenceIndex";

const TYPE_META = Object.fromEntries(REFERENCE_TYPES.map((t) => [t.id, t]));
const KIND_META = Object.fromEntries(CITING_KINDS.map((k) => [k.id, k]));
const CHIP_LIMIT = 4;

/** Reference types that get the "Cite" action. */
const CITABLE = new Set(["standard", "paper"]);

function CitationChip({ citation }: { citation: Citation }) {
  const kind = KIND_META[citation.kind];
  return (
    <Link
      to={citation.href}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      title={`${kind.label}: ${citation.code} ${citation.name}`}
    >
      <Icon name={kind.icon} className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="font-mono">{citation.code}</span>
      <span className="truncate text-muted-foreground max-w-[12rem]">{citation.name}</span>
      <span className="sr-only">({kind.label})</span>
    </Link>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setCopied(ok);
        if (ok) window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
      <span className="sr-only" aria-live="polite">
        {copied ? " to clipboard" : ""}
      </span>
    </Button>
  );
}

function CitePanel({ entry, id }: { entry: ReferenceEntry; id: string }) {
  const text = formatCitation(entry);
  const bibtex = formatBibtex(entry);
  return (
    <div id={id} className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      <p className="break-words text-sm">{text}</p>
      <pre className="overflow-x-auto rounded bg-background p-2 text-xs leading-relaxed">
        <code>{bibtex}</code>
      </pre>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy citation" />
        <CopyButton text={bibtex} label="Copy BibTeX" />
      </div>
    </div>
  );
}

export interface ReferenceCardProps {
  entry: ReferenceEntry;
  query?: string;
  /** Hide the domain label (the grouped view already shows it as a heading). */
  hideDomain?: boolean;
  /** Heading level for the title (h4 inside the grouped view). */
  titleAs?: "h3" | "h4";
}

export const ReferenceCard = memo(function ReferenceCard({
  entry,
  query = "",
  hideDomain = false,
  titleAs: Title = "h3",
}: ReferenceCardProps) {
  const [showAll, setShowAll] = useState(false);
  const [citeOpen, setCiteOpen] = useState(false);
  const citeId = useId();
  const type = TYPE_META[entry.type];
  const chips = showAll ? entry.citedBy : entry.citedBy.slice(0, CHIP_LIMIT);
  const hidden = entry.citedBy.length - chips.length;
  const linkable = isWebUrl(entry.url);

  return (
    <article className="rounded-lg border bg-card p-4" aria-labelledby={`${citeId}-title`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Title id={`${citeId}-title`} className="font-semibold leading-snug">
            {linkable ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Highlight text={entry.title} query={query} />
                <ExternalLink
                  className="ml-1 inline h-3.5 w-3.5 align-[-2px] text-muted-foreground"
                  aria-hidden
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <Highlight text={entry.title} query={query} />
            )}
          </Title>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1 font-normal" title={type.description}>
              <Icon name={type.icon} className="h-3 w-3" />
              {type.singular}
            </Badge>
            {!hideDomain && (
              <span className="font-mono">
                <Highlight text={entry.domain} query={query} />
              </span>
            )}
            {entry.alsoCitedAs.length > 0 && (
              <span className="min-w-0" title={entry.alsoCitedAs.join(" · ")}>
                · also cited as “{entry.alsoCitedAs[0]}”
                {entry.alsoCitedAs.length > 1 ? ` +${entry.alsoCitedAs.length - 1}` : ""}
              </span>
            )}
          </div>
        </div>
        {CITABLE.has(entry.type) && (
          <Button
            type="button"
            variant={citeOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 shrink-0 self-start"
            aria-expanded={citeOpen}
            aria-controls={citeOpen ? `${citeId}-cite` : undefined}
            onClick={() => setCiteOpen((v) => !v)}
          >
            <Quote className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Cite
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground" id={`${citeId}-cited`}>
          Cited by {entry.citedBy.length}:
        </span>
        <ul className="flex flex-wrap gap-1.5" aria-labelledby={`${citeId}-cited`}>
          {chips.map((c) => (
            <li key={`${c.kind}:${c.id}`} className="min-w-0 max-w-full">
              <CitationChip citation={c} />
            </li>
          ))}
        </ul>
        {(hidden > 0 || showAll) && entry.citedBy.length > CHIP_LIMIT && (
          <button
            type="button"
            className="rounded-full px-2 py-0.5 text-xs text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={showAll}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show fewer" : `+${hidden} more`}
          </button>
        )}
      </div>

      {citeOpen && <CitePanel entry={entry} id={`${citeId}-cite`} />}
    </article>
  );
});

export default ReferenceCard;
