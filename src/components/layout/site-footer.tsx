import { Badge } from "@/components/ui/badge";
import { Wordmark } from "@/components/layout/wordmark";
import { footerRoutes } from "@/config/navigation";
import { site } from "@/config/site";

const dataSources = [
  { label: "data.gov.my", href: site.links.dataGovMy },
  { label: "OpenDOSM", href: site.links.openDosm },
  { label: "Bank Negara Malaysia", href: site.links.bnm },
];

/** Global footer: brand, modules, data sources, licence attribution. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto] md:gap-16">
          <div className="max-w-sm space-y-3">
            <Wordmark />
            <p className="text-sm text-muted-foreground">{site.description}</p>
            <p className="text-sm text-muted-foreground">
              A{" "}
              <a
                href={site.brand.companyUrl}
                className="underline underline-offset-4 hover:text-foreground"
                rel="noreferrer"
                target="_blank"
              >
                {site.brand.company}
              </a>{" "}
              product.
            </p>
          </div>

          <nav aria-label="Modules" className="space-y-3">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Modules
            </h2>
            <ul className="space-y-2 text-sm">
              {footerRoutes.map((route) => (
                <li key={route.id}>
                  {route.status === "live" ? (
                    <a href={route.path} className="text-muted-foreground hover:text-foreground">
                      {route.label}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                      {route.label}
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                        soon
                      </Badge>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Data sources" className="space-y-3">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Data sources
            </h2>
            <ul className="space-y-2 text-sm">
              {dataSources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    rel="noreferrer"
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Statistical data © Department of Statistics Malaysia and originating agencies, under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              rel="noreferrer"
              target="_blank"
              className="underline underline-offset-4"
            >
              CC BY 4.0
            </a>
            .
          </p>
          <p>
            © {new Date().getFullYear()} {site.brand.company}
          </p>
        </div>
      </div>
    </footer>
  );
}
