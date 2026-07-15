import { env } from "@/config/env";

/** Site identity — the single source for name, description, and links. */
export const site = {
  name: "MyMalaysia",
  tagline: "Explore Malaysia through data",
  description:
    "The most beautiful way to explore Malaysia through open public data — interactive maps, live indicators, and deep statistics for every state and district.",
  url: env.NEXT_PUBLIC_SITE_URL,
  brand: {
    company: "Swymble",
    companyUrl: "https://swymble.com",
  },
  links: {
    github: "https://github.com/swymble/mymalaysia",
    dataGovMy: "https://data.gov.my",
    openDosm: "https://open.dosm.gov.my",
    bnm: "https://apikijangportal.bnm.gov.my",
  },
} as const;
