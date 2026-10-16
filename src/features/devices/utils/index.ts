import type { AnomalyRow, AnomalySeverity, DispenserType, FleetFlag } from "@/db/queries/devices";
import type { GetFleetInput } from "@/trpc/schema";

/* ────────────────────────────────────────────────────────────────────────────
   Labels
   ──────────────────────────────────────────────────────────────────────────── */

export const DISPENSER_TYPE_LABELS: Record<DispenserType, string> = {
  own_device: "Own device",
  standard: "Standard",
  premium: "Premium",
};

export const FLEET_FLAG_LABELS: Record<NonNullable<FleetFlag>, string> = {
  offline: "Offline",
  tds_high: "Rising TDS",
  purity_low: "Low purity",
  filter_due: "Filter due",
};

export const ANOMALY_SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  high: "High",
  medium: "Medium",
};

export function flagBadgeVariant(flag: FleetFlag): "success" | "warning" | "error" {
  if (flag === null) return "success";
  if (flag === "offline") return "error";
  return "warning";
}

export function anomalyBadgeVariant(severity: AnomalySeverity): "error" | "warning" {
  return severity === "high" ? "error" : "warning";
}

/** Ticket type a one-click dispatch should raise for an anomaly's signals. */
export function ticketTypeForAnomaly(anomaly: AnomalyRow): "filter_change" | "repair" {
  const tds = anomaly.latestTds ?? 0;
  const purity = anomaly.latestPurity ?? 100;
  return tds > 450 || purity < 85 ? "filter_change" : "repair";
}

/* ────────────────────────────────────────────────────────────────────────────
   Time helpers
   ──────────────────────────────────────────────────────────────────────────── */

/** "just now" / "42m ago" / "3h ago" / "5d ago" — for last-reading columns. */
export function formatRelativeTime(value: Date | string | null, now: Date = new Date()): string {
  if (value === null) return "never";

  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.max(0, (now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;

  const days = hours / 24;
  if (days < 28) return `${Math.floor(days)}d ago`;

  return `${Math.floor(days / 30)}mo ago`;
}

/** Whole days since the last filter change, as of `now`. */
export function filterAgeDays(lastFilterChangeDate: string, now: Date = new Date()): number {
  const then = new Date(`${lastFilterChangeDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000));
}

/* ────────────────────────────────────────────────────────────────────────────
   Fleet table state ⇄ tRPC input
   ──────────────────────────────────────────────────────────────────────────── */

export const FLEET_PAGE_SIZE = 25;

export type FleetTableState = {
  page: number;
  areaId?: number;
  type?: DispenserType;
  online?: boolean;
};

export const DEFAULT_FLEET_TABLE_STATE: FleetTableState = { page: 1 };

/**
 * Maps UI state to the tRPC input. Unset filters are omitted entirely so the
 * server prefetch key and the first client render key are byte-identical.
 */
export function toFleetTableInput(state: FleetTableState): GetFleetInput {
  return {
    page: state.page,
    limit: FLEET_PAGE_SIZE,
    ...(state.areaId ? { areaId: state.areaId } : {}),
    ...(state.type ? { type: state.type } : {}),
    ...(state.online !== undefined ? { online: state.online } : {}),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Telemetry chart config
   ──────────────────────────────────────────────────────────────────────────── */

/** Legend swatches — shared by the fleet trend card and the device drawer. */
export const TDS_SWATCH = "bg-[#0284c7] dark:bg-[#38bdf8]";
export const PURITY_SWATCH = "bg-[#059669] dark:bg-[#34d399]";

/**
 * Dual y-axis escape hatch for TDS/purity telemetry: TDS (~200–500 ppm) and
 * purity (~85–99%) need separate scales, so the purity series must declare
 * `yAxisIndex: 1`. Both axes use `scale: true` so the range follows the data —
 * ECharts otherwise anchors value axes at zero, flattening a 300–350 ppm swing
 * into a straight line. Axis styling stays neutral gray so it reads in both
 * themes.
 */
export const TDS_PURITY_AXES = [
  {
    type: "value" as const,
    scale: true,
    name: "TDS (ppm)",
    position: "left" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    nameTextStyle: { color: "#808080", fontSize: 10 },
    axisLabel: { color: "#808080", fontSize: 10 },
    splitLine: {
      show: true,
      lineStyle: { color: "rgba(128, 128, 128, 0.25)", type: [3, 3] as [number, number], width: 1 },
    },
  },
  {
    type: "value" as const,
    scale: true,
    name: "Purity (%)",
    position: "right" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    nameTextStyle: { color: "#808080", fontSize: 10 },
    axisLabel: { color: "#808080", fontSize: 10 },
    splitLine: { show: false },
  },
];
