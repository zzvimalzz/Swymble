import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FuelBoard } from "@/features/live/fuel-board";
import { FxBoard } from "@/features/live/fx-board";
import { WeatherBoard } from "@/features/live/weather-board";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.live.label,
  description: routes.live.description,
};

/** Live as its own destination: the full boards, wide. */
export default function LivePage() {
  return (
    <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Live · Malaysia right now
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl">
        The week&apos;s numbers<span className="text-brand-selat">.</span>
      </h1>

      <section aria-labelledby="live-fuel" className="mt-12">
        <h2 id="live-fuel" className="mb-4 text-2xl">
          At the pump
        </h2>
        <FuelBoard />
      </section>

      <section aria-labelledby="live-fx" className="mt-16">
        <h2 id="live-fx" className="mb-4 text-2xl">
          The ringgit
        </h2>
        <FxBoard />
      </section>

      <section aria-labelledby="live-weather" className="mt-16">
        <h2 id="live-weather" className="mb-4 text-2xl">
          The sky today
        </h2>
        <WeatherBoard />
      </section>

      <div className="mt-16 flex flex-wrap items-center gap-4">
        <Button asChild>
          <Link href={routes.transit.path}>Watch live transit</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={routes.map.path}>Open the atlas</Link>
        </Button>
      </div>
    </div>
  );
}
