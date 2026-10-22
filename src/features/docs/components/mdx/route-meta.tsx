import { Clock, ExternalLink } from "lucide-react";

import { LIVE_URL } from "@/features/docs/constants";

import { SourceLink } from "./source-link";

type RouteMetaProps = {
  live: string;
  time: string;
  repoPath: string;
};

export function RouteMeta({ live, time, repoPath }: RouteMetaProps) {
  return (
    <div className="not-prose bg-muted/30 my-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border px-4 py-3 text-sm">
      <a
        href={`${LIVE_URL}${live}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open the live ${live} route`}
        className="hover:text-muted-foreground inline-flex items-center gap-1.5 font-medium transition-colors"
      >
        <ExternalLink aria-hidden className="size-3.5 opacity-60" />
        Live route
      </a>

      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <Clock aria-hidden className="size-3.5 opacity-60" />
        Read time
        <span className="text-foreground font-medium">{time}</span>
      </span>

      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        Page source
        <SourceLink path={repoPath} className="text-foreground" />
      </span>
    </div>
  );
}
