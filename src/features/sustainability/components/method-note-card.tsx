import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";
import { JAR_SIZE_LITRES, PLAN_LITRES_PER_DAY } from "@/db/queries/plans";
import { PLAN_LABELS, PLAN_ORDER } from "@/features/sustainability/utils";

/**
 * Required method note — every sustainability number is an estimate derived
 * from subscription-days, not a meter reading, and the page must say so.
 */
export function MethodNoteCard(): React.ReactElement {
  const rates = PLAN_ORDER.map((plan) => `${PLAN_LABELS[plan]} ${PLAN_LITRES_PER_DAY[plan]} L`).join(" · ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>How we estimate impact</CardTitle>
        <p className="text-muted-foreground text-sm">
          These figures are derived from subscription records, not meter readings.
        </p>
      </CardHeader>

      <CardPanel className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Litres served = active subscription-days × the plan&apos;s daily estimate ({rates}).
        </p>
        <p className="text-muted-foreground">
          Jars avoided = litres ÷ {JAR_SIZE_LITRES} L — the equivalent single-use 20 L jars displaced.
        </p>
        <p className="text-muted-foreground">
          Totals cover every subscription since the first one, including cancelled households.
        </p>
      </CardPanel>
    </Card>
  );
}
