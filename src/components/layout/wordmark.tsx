import Link from "next/link";

import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The MyMalaysia wordmark. "My" is set in selat blue — the interface color —
 * against the ink foreground, in the display face.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home.path}
      className={cn(
        "rounded-sm font-display text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      aria-label={`${site.name} — home`}
    >
      <span className="text-brand-selat">My</span>
      <span>Malaysia</span>
    </Link>
  );
}
