import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads",
};

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Leads</h1>
      <p className="text-muted-foreground text-sm">Sales funnel — lead volume, visit and conversion rates by source.</p>
    </div>
  );
}
