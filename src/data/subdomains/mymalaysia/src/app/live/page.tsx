"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { routes } from "@/config/navigation";

/** Legacy route: the Live board is now a panel inside the Atlas. */
export default function LivePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${routes.map.path}?panel=live`);
  }, [router]);

  return null;
}
