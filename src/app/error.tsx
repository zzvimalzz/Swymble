"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the Worker's observability logs; a client-side error
    // monitor (Sentry) is a later-wave decision.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[96rem] flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-sm text-muted-foreground">Something broke</p>
      <h1 className="max-w-2xl text-4xl sm:text-5xl">
        An unexpected error<span className="text-brand-selat">.</span>
      </h1>
      <p className="max-w-prose text-muted-foreground">
        The page hit a problem it couldn&apos;t recover from. Try again — if it persists, it&apos;s
        on us{error.digest ? ` (reference ${error.digest})` : ""}.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
