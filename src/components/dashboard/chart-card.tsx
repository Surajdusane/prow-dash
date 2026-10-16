import type { ReactNode } from "react";

import { Card, CardHeader, CardPanel, CardTitle } from "@/components/ui/card";

/** Card shell for chart sections — keeps every chart in a fixed-height container. */
export function ChartCard({
  title,
  description,
  headerExtra,
  children,
  className,
}: {
  title: string;
  description?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        {headerExtra ? <div className="pt-2">{headerExtra}</div> : null}
      </CardHeader>
      <CardPanel className="flex-1 p-6 pt-0">{children}</CardPanel>
    </Card>
  );
}
