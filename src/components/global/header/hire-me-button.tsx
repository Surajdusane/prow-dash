import React from "react";

import { Button } from "@/components/ui/button";
import { CONTACT_URL } from "@/features/docs/constants";

export const HiremMeButton = () => {
  return (
    <Button
      variant={"secondary"}
      size={"lg"}
      className="overflow-hidden rounded-none"
      render={<a href={CONTACT_URL} target="_blank" rel="noreferrer" />}
      aria-label="Hire me — open contact details in a new tab"
    >
      <span className="relative z-20">Hire Me</span>

      {/* Shine sweep — animates continuously instead of on hover */}
      <span
        aria-hidden
        className="animate-hire-shine bg-foreground/10 absolute top-0 left-[-75%] z-10 h-full w-1/2 rotate-12 blur-lg motion-reduce:animate-none"
      />
    </Button>
  );
};
