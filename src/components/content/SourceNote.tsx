/**
 * SourceNote — provenance line for a dataset (A11: "provenance everywhere").
 *
 * Props:
 *   source: { name: string; version?: string; url?: string; retrievedAt?: string }
 *       retrievedAt: ISO date ("2026-11-03") or month ("2026-11"); shown as "retrieved 3 Nov 2026"
 *   prefix?: string        — default "Source"
 *   className?: string
 *
 * Usage:
 *   <SourceNote source={{ name: "OWASP AISVS", version: "1.01", url: AISVS_URL, retrievedAt: "2026-11-03" }} />
 */

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SourceInfo {
  name: string;
  version?: string;
  url?: string;
  retrievedAt?: string;
}

export interface SourceNoteProps {
  source: SourceInfo;
  prefix?: string;
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRetrieved(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return v;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return v;
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
}

export function SourceNote({ source, prefix = "Source", className }: SourceNoteProps) {
  const label = `${source.name}${source.version ? ` ${source.version}` : ""}`;
  const safeUrl = source.url && /^https?:\/\//i.test(source.url) ? source.url : undefined;
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <span>{prefix}: </span>
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          {label}
          <ExternalLink aria-hidden className="h-3 w-3" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <span className="font-medium text-foreground/80">{label}</span>
      )}
      {source.retrievedAt && (
        <>
          <span aria-hidden> · </span>
          <span>
            retrieved{" "}
            <time dateTime={source.retrievedAt}>{formatRetrieved(source.retrievedAt)}</time>
          </span>
        </>
      )}
    </p>
  );
}

export default SourceNote;
