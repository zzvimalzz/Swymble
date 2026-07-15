import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-6 px-4 py-24 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading page"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-14 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-prose" />
      <Skeleton className="h-4 w-2/3 max-w-prose" />
    </div>
  );
}
