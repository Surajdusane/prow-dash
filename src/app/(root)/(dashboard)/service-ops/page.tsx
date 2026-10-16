import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Ops",
};

export const dynamic = "force-dynamic";

export default function ServiceOpsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Service Ops</h1>
      <p className="text-muted-foreground text-sm">
        Field operations — ticket board, predictive service list and technician workload.
      </p>
    </div>
  );
}
