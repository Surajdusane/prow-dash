import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustainability",
};

export const dynamic = "force-dynamic";

export default function SustainabilityPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Sustainability</h1>
      <p className="text-muted-foreground text-sm">
        Environmental impact — litres served, jars avoided and monthly impact trend.
      </p>
    </div>
  );
}
