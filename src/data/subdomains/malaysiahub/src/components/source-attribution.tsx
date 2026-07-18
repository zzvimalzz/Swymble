import type { DatasetManifest, QualityStatus } from "@/types/dataset";
import { cn } from "@/lib/utils";

const QUALITY_LABEL: Record<QualityStatus, string> = {
  ok: "current",
  stale: "awaiting update",
  degraded: "degraded",
  unavailable: "unavailable",
};

const QUALITY_DOT: Record<QualityStatus, string> = {
  ok: "bg-status-ok",
  stale: "bg-status-caution",
  degraded: "bg-status-caution",
  unavailable: "bg-status-critical",
};

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
}

export interface SourceAttributionProps {
  manifest: DatasetManifest;
  /** From the fetched artifact envelope; null when not yet loaded/available. */
  updatedAt: string | null;
  quality: QualityStatus;
  className?: string;
}

/**
 * The licence-required attribution line every dataset view renders: source
 * link, licence, data vintage, and live quality status. Designed as part of
 * the interface, not a footnote.
 */
export function SourceAttribution({
  manifest,
  updatedAt,
  quality,
  className,
}: SourceAttributionProps) {
  const updated = formatUpdatedAt(updatedAt);

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground",
        className,
      )}
    >
      <a
        href={manifest.source.url}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 hover:text-foreground"
      >
        {manifest.source.portal}
      </a>
      <span aria-hidden>·</span>
      <a
        href={manifest.source.licenceUrl}
        target="_blank"
        rel="noreferrer"
        className="hover:text-foreground"
      >
        {manifest.source.licence}
      </a>
      {updated && (
        <>
          <span aria-hidden>·</span>
          <span>as of {updated}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", QUALITY_DOT[quality])} aria-hidden />
        {QUALITY_LABEL[quality]}
      </span>
    </p>
  );
}
