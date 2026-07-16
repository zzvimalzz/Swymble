"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { routes } from "@/config/navigation";

/**
 * Legacy route: the Explorer became the Atlas at /map. A client redirect
 * (not next.config redirects) because the static-export build mode doesn't
 * support server redirects; deep links (?state=) are preserved.
 */
function ExplorerRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const state = searchParams.get("state");
    router.replace(`${routes.map.path}${state ? `?state=${encodeURIComponent(state)}` : ""}`);
  }, [router, searchParams]);

  return null;
}

export default function ExplorerPage() {
  return (
    <Suspense>
      <ExplorerRedirect />
    </Suspense>
  );
}
