import Image from "next/image";

import { cn } from "@/lib/utils";

type ScreenshotProps = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
};

export function Screenshot({ src, alt, caption, width, height, priority, className }: ScreenshotProps) {
  return (
    <figure className={cn("bg-muted/30 my-6 overflow-hidden rounded-xl border", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 768px) 768px, 100vw"
        className="h-auto w-full"
      />
      {caption ? (
        <figcaption className="bg-muted/40 text-muted-foreground border-t px-4 py-3 text-sm">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
