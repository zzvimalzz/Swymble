import type { DatasetManifest } from "@/types/dataset";

/**
 * Static transit networks (routes, stops, shapes) from the official GTFS
 * Static feeds. One manifest per network; etl/gtfs builds each artifact.
 * These are the skeleton the live GTFS-Realtime vehicles move along.
 */

const GTFS_SOURCE = {
  provider: "Agensi Pengangkutan Awam Darat (APAD) / data.gov.my",
  portal: "data.gov.my",
  url: "https://developer.data.gov.my/realtime-api/gtfs-static",
  licence: "CC BY 4.0",
  licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
} as const;

function transitNetworkManifest(
  network: string,
  title: string,
  description: string,
  upstreamUrl: string,
): DatasetManifest {
  return {
    id: `transit-network-${network}`,
    title,
    description,
    module: "transit",
    tier: "A",
    cadence: "daily",
    source: GTFS_SOURCE,
    upstream: { kind: "gtfs", url: upstreamUrl },
    artifact: { path: `data/transit/${network}.json`, format: "json" },
  };
}

export const transitNetworkManifests: DatasetManifest[] = [
  transitNetworkManifest(
    "ktmb",
    "KTMB rail network",
    "KTM Komuter, ETS, and intercity lines with stations, from KTMB's official GTFS feed.",
    "https://api.data.gov.my/gtfs-static/ktmb",
  ),
  transitNetworkManifest(
    "rapid-rail-kl",
    "Rapid Rail KL network",
    "LRT, MRT, Monorail, and BRT lines with every station, from Prasarana's official GTFS feed.",
    "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl",
  ),
  transitNetworkManifest(
    "rapid-bus-kl",
    "Rapid Bus KL network",
    "Rapid Bus routes and stops across the Klang Valley, from Prasarana's official GTFS feed.",
    "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-kl",
  ),
  transitNetworkManifest(
    "rapid-bus-penang",
    "Rapid Bus Penang network",
    "Rapid Bus routes and stops across Penang, from Prasarana's official GTFS feed.",
    "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-penang",
  ),
  transitNetworkManifest(
    "rapid-bus-kuantan",
    "Rapid Bus Kuantan network",
    "Rapid Bus routes and stops around Kuantan, from Prasarana's official GTFS feed.",
    "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-kuantan",
  ),
];
