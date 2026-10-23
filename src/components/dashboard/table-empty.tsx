import type React from "react";

import { Inbox } from "lucide-react";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Shared empty state rendered as a full-width table row - used by every table
 * when filters or an empty database leave nothing to show.
 */
export function TableEmpty({
  colSpan,
  title,
  description,
  icon,
  className,
}: {
  colSpan: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={cn("p-0", className)}>
        <Empty className="py-10 md:py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">{icon ?? <Inbox />}</EmptyMedia>
            <EmptyTitle className="text-base">{title}</EmptyTitle>
            {description ? <EmptyDescription>{description}</EmptyDescription> : null}
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  );
}
