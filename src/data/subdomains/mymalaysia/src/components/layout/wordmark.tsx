import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/navigation";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * The MyMalaysia identity: the tricolor mark (crescent, the two halves of
 * the country, data bars) beside the wordmark — "My" in selat blue.
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
      <Image
        src="/images/mymalaysia_logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
        priority
      />
      <span className="font-display text-lg font-semibold tracking-tight">
        <span className="text-brand-selat">My</span>
        <span>Malaysia</span>
      </span>
    </Link>
  );
}
