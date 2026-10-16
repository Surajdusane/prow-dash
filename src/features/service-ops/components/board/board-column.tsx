"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Badge } from "@/components/ui/badge";
import type { BoardTicket } from "@/db/queries/tickets";
import { SortableTicketCard } from "@/features/service-ops/components/board/ticket-card";
import type { BoardColumnId } from "@/features/service-ops/utils";
import { cn } from "@/lib/utils";

export interface BoardColumnDefinition {
  id: BoardColumnId;
  title: string;
  description: string;
}

/** A droppable column of sortable ticket cards. */
export function BoardColumn({
  column,
  tickets,
  onOpenTicket,
}: {
  column: BoardColumnDefinition;
  tickets: BoardTicket[];
  onOpenTicket: (ticket: BoardTicket) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const sortableIds = useMemo(() => tickets.map((ticket) => String(ticket.id)), [tickets]);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-muted/32 flex min-w-0 flex-col rounded-2xl border transition-colors",
        isOver && "border-ring ring-ring/16 ring-2"
      )}
    >
      <header className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{column.title}</h3>
          <Badge variant="secondary" size="sm" className="ms-auto tabular-nums">
            {tickets.length}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">{column.description}</p>
      </header>

      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="flex max-h-[600px] min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {tickets.length === 0 ? (
            <div className="text-muted-foreground border-border/72 flex flex-1 items-center justify-center rounded-xl border border-dashed p-6 text-xs">
              Drop tickets here
            </div>
          ) : (
            tickets.map((ticket) => <SortableTicketCard key={ticket.id} ticket={ticket} onOpen={onOpenTicket} />)
          )}
        </div>
      </SortableContext>
    </section>
  );
}
