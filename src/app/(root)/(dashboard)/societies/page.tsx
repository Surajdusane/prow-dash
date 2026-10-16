import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Societies",
};

export const dynamic = "force-dynamic";

export default function SocietiesPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">Societies</h1>
      <p className="text-muted-foreground text-sm">
        Expansion and penetration — society list, coverage by area and onboarding growth.
      </p>
    </div>
  );
}
