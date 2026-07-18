import { env } from "@/config/env";

/** Site identity — the single source for name, description, and links. */
export const site = {
  name: "MalaysiaHub",
  tagline: "Everything Malaysia, in one place",
  description:
    "The daily operating system for living in Malaysia — fuel prices, ringgit rates, salary and tax calculators, government services, and transit, in one beautiful place.",
  url: env.NEXT_PUBLIC_SITE_URL,
  brand: {
    company: "Swymble",
    companyUrl: "https://swymble.com",
  },
  links: {
    github: "https://github.com/swymble/malaysiahub",
    dataGovMy: "https://data.gov.my",
    openDosm: "https://open.dosm.gov.my",
    bnm: "https://apikijangportal.bnm.gov.my",
  },
} as const;
