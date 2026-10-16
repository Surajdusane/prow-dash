"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ComplaintRow } from "@/db/queries/complaints";
import { useResolveComplaint } from "@/features/customers/hooks";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_SEVERITY_LABELS,
  complaintSeverityVariant,
} from "@/features/customers/utils";
import { formatDateKey } from "@/lib/format";

/**
 * Complaint history with inline resolve. The list is capped by the caller —
 * this component renders exactly what it is given.
 */
export function ComplaintsList({ complaints }: { complaints: ComplaintRow[] }) {
  const resolve = useResolveComplaint();

  if (complaints.length === 0) {
    return <p className="text-muted-foreground text-sm">No complaints logged for this household.</p>;
  }

  return (
    <ul className="divide-border flex flex-col divide-y">
      {complaints.map((complaint) => {
        const resolving = resolve.isPending && resolve.variables?.id === complaint.id;

        return (
          <li key={complaint.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{COMPLAINT_CATEGORY_LABELS[complaint.category]}</span>
                <Badge size="sm" variant={complaintSeverityVariant(complaint.severity)}>
                  {COMPLAINT_SEVERITY_LABELS[complaint.severity]}
                </Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatDateKey(complaint.date)}
                {complaint.resolved && complaint.resolutionDate
                  ? ` · resolved ${formatDateKey(complaint.resolutionDate)}`
                  : ""}
              </span>
            </div>

            {complaint.resolved ? (
              <Badge size="sm" variant="success" className="shrink-0">
                Resolved
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={resolving}
                onClick={() => resolve.mutate({ id: complaint.id })}
              >
                {resolving ? <Spinner /> : null}
                Resolve
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
