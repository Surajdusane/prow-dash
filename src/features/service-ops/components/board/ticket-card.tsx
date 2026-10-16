"use client";

import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BoardTicket } from "@/db/queries/tickets";
import { getSlaState, technicianInitials, TICKET_TYPE_LABELS, type SlaTone } from "@/features/service-ops/utils";
import { formatDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

const SLA_BADGE_VARIANT: Record<SlaTone, BadgeProps["variant"]> = {
  success: "success",
  warning: "warning",
  error: "error",
  muted: "outline",
};

interface TicketCardContentProps {
  ticket: BoardTicket;
  onOpen?: (ticket: BoardTicket) => void;
  /** Drag overlay copy — no click handler, lifted instead. */
  overlay?: boolean;
}

/** One kanban card: identity, household, technician and SLA state at a glance. */
export function TicketCardContent({ ticket, onOpen, overlay = false }: TicketCardContentProps) {
  const sla = getSlaState(ticket);

  return (
    <article
      className={cn(
        "bg-card flex flex-col gap-2 rounded-xl border p-3 shadow-xs/5 transition-colors",
        onOpen && "hover:border-ring cursor-pointer",
        overlay && "border-ring shadow-lg"
      )}
      onClick={onOpen ? () => onOpen(ticket) : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-xs">#{ticket.id}</span>
        <Badge size="sm" variant="secondary">
          {TICKET_TYPE_LABELS[ticket.type]}
        </Badge>
        <Badge size="sm" variant={SLA_BADGE_VARIANT[sla.tone]} className="ms-auto">
          {sla.label}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {ticket.flatNumber} · {ticket.societyName}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {ticket.residentName} · {ticket.areaName}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-2">
        {ticket.technicianName ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">{technicianInitials(ticket.technicianName)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs">{ticket.technicianName}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Unassigned</span>
        )}
        <span className="text-muted-foreground shrink-0 text-xs">{formatDateKey(ticket.raisedDate)}</span>
      </div>
    </article>
  );
}

/** Sortable/draggable wrapper — dnd id is the stringified ticket id. */
export function SortableTicketCard({ ticket, onOpen }: { ticket: BoardTicket; onOpen: (ticket: BoardTicket) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(ticket.id),
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TicketCardContent ticket={ticket} onOpen={onOpen} />
    </div>
  );
}
