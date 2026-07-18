import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The MalaysiaHub identity: the tricolor mark beside the wordmark —
 * "Hub" in selat blue (the interactive hue: this is where everything meets).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href={routes.home.path}
      className={cn(
        "flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      aria-label={`${site.name} — home`}
    >
      {/* The emblem's navy crescent/map disappears on dark surfaces, so it
          rides on a white "coin" (app-icon style) for guaranteed contrast in
          both themes. */}
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-black/10 dark:ring-white/15">
        <Image
          src="/images/mymalaysia_logo.png"
          alt=""
          width={32}
          height={32}
          className="size-7"
          priority
        />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        <span>Malaysia</span>
        <span className="text-brand-selat">Hub</span>
      </span>
    </Link>
  );
}
