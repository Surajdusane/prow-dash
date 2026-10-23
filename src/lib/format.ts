/** Shared number, currency and date formatters for the dashboard features. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

/** ₹7,32,154 - full Indian-grouped rupees, for KPI cards and tables. */
export const formatInr = (value: number): string => inrFormatter.format(value);

/** ₹7.3L / ₹1.2Cr - axis-friendly rupee shorthand. */
export const formatInrCompact = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${Math.round(abs / 1_000)}k`;
  return `${sign}₹${Math.round(abs)}`;
};

/** 1,234 */
export const formatNumber = (value: number): string => numberFormatter.format(value);

/** 1.2k / 3.4L - compact axis labels. */
export const formatCompact = (value: number): string =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** "2025-05" → "May 25" */
export const formatMonth = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTHS[(monthNumber ?? 1) - 1]} ${String(year).slice(2)}`;
};

/** "2026-10-15" → "15 Oct 2026" */
export const formatDateKey = (dateKey: string): string => {
  const [year, monthNumber, day] = dateKey.split("-").map(Number);
  return `${day} ${MONTHS[(monthNumber ?? 1) - 1]} ${year}`;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Date object → "15 Oct 2026" - for timestamps that cross tRPC as real Dates. */
export const formatDate = (value: Date): string => dateFormatter.format(value);
