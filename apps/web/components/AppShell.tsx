import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Header } from "./Header";

interface AppShellProps {
  children: ReactNode;
  subtitle?: string;
  experimental?: ReactNode;
}

export function AppShell({
  children,
  subtitle = "A starter kit for building dApps on the XRP Ledger.",
  experimental,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <section className="mb-10 max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Build on the XRPL
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Scaffold-XRP</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
        </section>
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {children}
        </div>
        {experimental && <div className="mt-6 grid gap-6 md:grid-cols-2">{experimental}</div>}
      </main>
      <footer className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-xs text-muted-foreground">
          <span>Scaffold-XRP</span>
          <nav aria-label="Resources" className="flex items-center gap-5">
            <a
              className="transition-colors hover:text-foreground"
              href="https://github.com/XRPL-Commons/scaffold-xrp#readme"
            >
              Documentation
            </a>
            <a
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              href="https://github.com/XRPL-Commons/scaffold-xrp"
            >
              GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
