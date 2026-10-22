import { ExternalLink } from "lucide-react";

import { GITHUB_REF, GITHUB_URL } from "@/features/docs/constants";
import { cn } from "@/lib/utils";

type SourceLinkProps = {
  path: string;
  symbol?: string;
  /** Line range in GitHub's `#L12-L40` format, without the leading `#`. */
  lines?: string;
  label?: string;
  className?: string;
};

export function SourceLink({ path, symbol, lines, label, className }: SourceLinkProps) {
  const href = `${GITHUB_URL}/blob/${GITHUB_REF}/${encodeURI(path)}${lines ? `#L${lines}` : ""}`;
  const name = label ?? path.split("/").at(-1);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={symbol ? `View ${symbol} in ${path} on GitHub` : `View ${path} on GitHub`}
      title={symbol ? `${symbol} · ${path}` : path}
      className={cn(
        "decoration-border hover:text-foreground inline-flex items-baseline gap-1 font-medium underline underline-offset-4 transition-colors hover:decoration-current",
        className
      )}
    >
      <span>{name}</span>
      <ExternalLink aria-hidden className="size-3.5 shrink-0 self-center opacity-60" />
    </a>
  );
}
