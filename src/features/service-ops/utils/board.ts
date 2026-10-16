import type { BoardTicket, TicketStatus, TicketType } from "@/db/queries/tickets";

export type BoardColumnId = "new" | "assigned" | "in_progress" | "resolved";

export const BOARD_COLUMNS: { id: BoardColumnId; title: string; description: string }[] = [
  { id: "new", title: "New", description: "Open · unassigned" },
  { id: "assigned", title: "Assigned", description: "Technician dispatched" },
  { id: "in_progress", title: "In progress", description: "Work started" },
  { id: "resolved", title: "Resolved", description: "Closed · last 30 days" },
];

export const BOARD_COLUMN_IDS = BOARD_COLUMNS.map((column) => column.id);

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  filter_change: "Filter change",
  repair: "Repair",
  installation: "Installation",
  inspection: "Inspection",
};

export const TICKET_TYPES: TicketType[] = ["repair", "filter_change", "inspection", "installation"];

/**
 * Which kanban column a ticket belongs to. The board derives columns from
 * status + technician presence — "Assigned" is an open ticket with a technician.
 */
export function getTicketColumn(ticket: Pick<BoardTicket, "status" | "technicianId">): BoardColumnId {
  if (ticket.status === "resolved") return "resolved";
  if (ticket.status === "in_progress") return "in_progress";
  return ticket.technicianId === null ? "new" : "assigned";
}

export function groupTicketsByColumn(tickets: BoardTicket[]): Record<BoardColumnId, BoardTicket[]> {
  const grouped: Record<BoardColumnId, BoardTicket[]> = {
    new: [],
    assigned: [],
    in_progress: [],
    resolved: [],
  };

  for (const ticket of tickets) {
    grouped[getTicketColumn(ticket)].push(ticket);
  }

  return grouped;
}

/** Mirrors `SLA_HOURS` in `src/db/queries/tickets.ts` (documented targets — keep in sync). */
export const SLA_HOURS: Record<TicketType, number> = {
  repair: 48,
  filter_change: 72,
  inspection: 96,
  installation: 120,
};

export type SlaTone = "success" | "warning" | "error" | "muted";

export interface SlaState {
  label: string;
  tone: SlaTone;
}

/**
 * Countdown/overdue badge for an open ticket, or the met/missed verdict for a
 * resolved one. Day-granular so server and client renders agree.
 */
export function getSlaState(ticket: Pick<BoardTicket, "type" | "status" | "raisedDate" | "slaMet">): SlaState {
  if (ticket.status === "resolved") {
    if (ticket.slaMet === null) return { label: "Closed", tone: "muted" };
    return ticket.slaMet ? { label: "SLA met", tone: "success" } : { label: "SLA missed", tone: "error" };
  }

  const targetHours = SLA_HOURS[ticket.type];
  const raisedAt = new Date(`${ticket.raisedDate}T00:00:00`).getTime();
  const elapsedHours = (Date.now() - raisedAt) / 3_600_000;
  const daysLeft = Math.floor((targetHours - elapsedHours) / 24);

  if (daysLeft < 0) return { label: `Overdue ${Math.abs(daysLeft)}d`, tone: "error" };
  if (daysLeft === 0) return { label: "Due today", tone: "warning" };
  return { label: `${daysLeft}d left`, tone: daysLeft <= 1 ? "warning" : "muted" };
}

/** "Imran Pasha" → "IP" for the technician avatar. */
export function technicianInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** `YYYY-MM-DD` in local time — mirrors the server's date-key format. */
export function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
