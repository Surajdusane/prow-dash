import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Customers</h1>
      <p className="text-muted-foreground text-sm">
        Churn and risk — household risk table, risk distribution and complaint trends.
      </p>
    </div>
  );
}
