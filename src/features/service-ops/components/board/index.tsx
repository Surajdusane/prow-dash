"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { BoardTicket } from "@/db/queries/tickets";
import { BoardColumn } from "@/features/service-ops/components/board/board-column";
import { BoardFilters } from "@/features/service-ops/components/board/board-filters";
import { TicketCardContent } from "@/features/service-ops/components/board/ticket-card";
import { BoardColumnsSkeleton } from "@/features/service-ops/components/skeletons";
import { TicketDrawer } from "@/features/service-ops/components/ticket-drawer";
import { useAssignTicket, useGetBoard, useUpdateTicketStatus } from "@/features/service-ops/hooks";
import { useServiceOpsUiStore } from "@/features/service-ops/store";
import {
  BOARD_COLUMN_IDS,
  BOARD_COLUMNS,
  getTicketColumn,
  groupTicketsByColumn,
  type BoardColumnId,
} from "@/features/service-ops/utils";
import type { GetBoardInput } from "@/trpc/schema";

function resolveTargetColumn(tickets: BoardTicket[], overId: string): BoardColumnId | null {
  if (BOARD_COLUMN_IDS.includes(overId as BoardColumnId)) return overId as BoardColumnId;

  const overTicket = tickets.find((ticket) => String(ticket.id) === overId);
  return overTicket ? getTicketColumn(overTicket) : null;
}

/**
 * The service kanban: four derived columns, drag-and-drop orchestration with
 * optimistic mutations, and the ticket detail drawer.
 */
export function ServiceBoard() {
  const [filters, setFilters] = useState<GetBoardInput>({});

  // Non-suspense query: filter changes keep the board mounted (previous columns
  // stay via `keepPreviousData`), so the toolbar — search included — never
  // unmounts or loses focus while results load.
  const { data: tickets, isFetching, isError, error } = useGetBoard(filters);
  const updateStatus = useUpdateTicketStatus();
  const assign = useAssignTicket();
  const openAssignDialog = useServiceOpsUiStore((state) => state.openAssignDialog);

  const [activeTicket, setActiveTicket] = useState<BoardTicket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<BoardTicket | null>(null);

  const columns = useMemo(() => groupTicketsByColumn(tickets ?? []), [tickets]);

  // Prefer the latest board data for the cards in flight / drawer; the stored
  // snapshot only carries the id while the query is mid-swap (or after delete).
  const liveActive = activeTicket ? (tickets?.find((ticket) => ticket.id === activeTicket.id) ?? activeTicket) : null;
  const liveSelected = selectedTicket
    ? (tickets?.find((ticket) => ticket.id === selectedTicket.id) ?? selectedTicket)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTicket(tickets?.find((ticket) => String(ticket.id) === String(event.active.id)) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);

    const { active, over } = event;
    if (!over || !tickets) return;

    const ticket = tickets.find((candidate) => String(candidate.id) === String(active.id));
    if (!ticket) return;

    const targetColumn = resolveTargetColumn(tickets, String(over.id));
    if (!targetColumn || targetColumn === getTicketColumn(ticket)) return;

    switch (targetColumn) {
      case "assigned":
        // Dragged onto Assigned without a technician — ask who should take it.
        if (ticket.technicianId === null) {
          openAssignDialog(ticket);
          return;
        }
        if (ticket.status !== "open") updateStatus.mutate({ id: ticket.id, status: "open" });
        return;
      case "new":
        if (ticket.status !== "open") updateStatus.mutate({ id: ticket.id, status: "open" });
        if (ticket.technicianId !== null) assign.mutate({ id: ticket.id, technicianId: null });
        return;
      case "in_progress":
        updateStatus.mutate({ id: ticket.id, status: "in_progress" });
        return;
      case "resolved":
        updateStatus.mutate({ id: ticket.id, status: "resolved" });
        return;
    }
  };

  // Failed with nothing to show (first load, or a filter change that errored
  // with no previous data left) — let the route's error boundary take over
  // instead of leaving the board on a permanent skeleton.
  if (isError && tickets === undefined) throw error;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Service board</h2>
          <p className="text-muted-foreground text-sm">
            Drag tickets between stages — dropping a card applies the change immediately.
          </p>
        </div>

        <BoardFilters filters={filters} onChange={setFilters} isFetching={isFetching} />

        {tickets === undefined ? (
          <BoardColumnsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BOARD_COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tickets={columns[column.id]}
                onOpenTicket={setSelectedTicket}
              />
            ))}
          </div>
        )}
      </div>

      <DragOverlay>{liveActive ? <TicketCardContent ticket={liveActive} overlay /> : null}</DragOverlay>

      <TicketDrawer ticket={liveSelected} onClose={() => setSelectedTicket(null)} />
    </DndContext>
  );
}
