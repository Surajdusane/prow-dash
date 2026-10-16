import { DEFAULT_FLEET_TABLE_STATE, toFleetTableInput } from "@/features/devices/utils";
import { batchPrefetch, prefetch, trpc } from "@/trpc/server";

export const prefetchFleetStats = () => prefetch(trpc.devices.getFleetStats.queryOptions());

export const prefetchFleet = () =>
  prefetch(trpc.devices.getFleet.queryOptions(toFleetTableInput(DEFAULT_FLEET_TABLE_STATE)));

export const prefetchAnomalies = () => prefetch(trpc.devices.getAnomalies.queryOptions());

export const prefetchDeviceAreas = () => prefetch(trpc.devices.getAreas.queryOptions());

/**
 * Warms the overview page's above-the-fold queries in one pass — the headline
 * stats, the telemetry trend and the anomaly feed. Device readings are
 * intentionally excluded: the drawer owns its own windowed query and fetches on
 * open (and on each 30/90-day toggle).
 */
export const batchPrefetchDevicesOverview = () =>
  batchPrefetch([
    trpc.devices.getFleetStats.queryOptions(),
    trpc.devices.getReadingsTrend.queryOptions({ days: 30 }),
    trpc.devices.getAnomalies.queryOptions(),
  ]);

/** Warms the fleet table page: first page of the inventory + area filter options. */
export const batchPrefetchFleetTable = () =>
  batchPrefetch([
    trpc.devices.getFleet.queryOptions(toFleetTableInput(DEFAULT_FLEET_TABLE_STATE)),
    trpc.devices.getAreas.queryOptions(),
  ]);
