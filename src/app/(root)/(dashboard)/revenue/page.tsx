import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revenue",
};

export const dynamic = "force-dynamic";

export default function RevenuePage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Revenue</h1>
      <p className="text-muted-foreground text-sm">
        Subscriptions and billing — MRR trend, plan mix, cohort retention and overdue payments.
      </p>
    </div>
  );
}
