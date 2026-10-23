import { ArrowUpRight, Mail, Play } from "lucide-react";

import { Icons } from "@/components/ui/icons";
import { CONTACT_URL, GITHUB_URL, LIVE_URL } from "@/features/docs/constants";

const STACK = ["Next.js 16", "tRPC", "Drizzle", "Neon", "ECharts", "Fumadocs"];

export function ProjectLinks() {
  return (
    <div className="not-prose border-border/80 bg-muted/30 my-8 overflow-hidden rounded-xl border">
      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <a
          href={LIVE_URL}
          target="_blank"
          rel="noreferrer"
          className="group bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Play aria-hidden className="size-3.5 fill-current opacity-80" />
          Live demo
          <ArrowUpRight
            aria-hidden
            className="-mr-0.5 size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-background hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Icons.Github aria-hidden className="size-3.5 opacity-70" />
          GitHub
        </a>

        <a
          href={CONTACT_URL}
          className="text-foreground/80 hover:text-foreground hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Mail aria-hidden className="size-3.5 opacity-70" />
          Hire me
        </a>
      </div>

      <div className="border-border/70 bg-background/50 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 sm:px-4">
        <span className="text-muted-foreground/80 mr-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
          Built with
        </span>

        {STACK.map((tech) => (
          <span
            key={tech}
            className="border-border/80 bg-background text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
