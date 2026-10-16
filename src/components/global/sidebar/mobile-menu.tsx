"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

import { MainMenu } from "./main-menu";

export function MobileMenu() {
  const [isOpen, setOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTitle></SheetTitle>
      <SheetDescription></SheetDescription>
      <div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          className="relative flex h-8 w-8 items-center rounded-full md:hidden"
        >
          <Icons.Menu size={16} />
        </Button>
      </div>
      <SheetContent side="left" className="rounded-none border-none">
        <div className="mt-6 ml-8">
          <Icons.LogoSmall />
        </div>

        <div className="">
          <MainMenu onSelect={() => setOpen(false)} isExpanded={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
