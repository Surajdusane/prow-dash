"use client";

import { useState } from "react";
import Link from "next/link";

import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { MainMenu } from "./main-menu";

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "desktop:overflow-hidden desktop:rounded-tl-[10px] desktop:rounded-bl-[10px] ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; fixed top-0 z-50 hidden h-screen shrink-0 flex-col items-center justify-between pb-4 transition-all duration-200 md:flex",
        "bg-background border-border hidden border-r",
        isExpanded ? "w-60" : "w-[70px]"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className={cn(
          "bg-background border-border ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; absolute top-0 left-0 flex h-[70px] items-center justify-center border-b transition-all duration-200",
          isExpanded ? "w-full" : "w-[69px]"
        )}
      >
        <Link href="/" className="absolute left-[22px] transition-none">
          <Icons.LogoSmall />
        </Link>
      </div>

      <div className="flex w-full flex-1 flex-col pt-[70px]">
        <MainMenu isExpanded={isExpanded} />
      </div>
    </aside>
  );
}
