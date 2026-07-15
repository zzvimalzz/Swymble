import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-sm text-muted-foreground">404 — uncharted territory</p>
      <h1 className="max-w-2xl text-4xl sm:text-5xl">
        This page isn&apos;t on the map<span className="text-brand-selat">.</span>
      </h1>
      <p className="max-w-prose text-muted-foreground">
        The address may have moved, or it never existed. Malaysia has 16 states and about 160
        districts — this URL is not one of them.
      </p>
      <Button asChild>
        <Link href={routes.home.path}>Back to the homepage</Link>
      </Button>
    </div>
  );
}
