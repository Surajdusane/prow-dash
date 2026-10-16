import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devices",
};

export const dynamic = "force-dynamic";

export default function DevicesPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Devices</h1>
      <p className="text-muted-foreground text-sm">
        IoT fleet monitoring — dispenser health, telemetry readings and anomaly detection.
      </p>
    </div>
  );
}
