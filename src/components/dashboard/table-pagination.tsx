"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** Page numbers to render: first, last, current ±1, with "ellipsis" markers. */
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of pages) {
    if (page - previous > 1) items.push("ellipsis");
    items.push(page);
    previous = page;
  }
  return items;
}

/**
 * Server-paged table footer. Buttons (not links) because paging only flips
 * query state — nothing navigates.
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}): React.ReactElement | null {
  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            render={<button type="button" disabled={page <= 1} />}
            className={cn(buttonVariants({ variant: "ghost", size: "default" }), "max-sm:aspect-square max-sm:p-0")}
            onClick={() => {
              if (page > 1) onPageChange(page - 1);
            }}
          />
        </PaginationItem>

        {pageWindow(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                isActive={item === page}
                aria-label={`Page ${item}`}
                render={<button type="button" />}
                className={cn(buttonVariants({ variant: item === page ? "outline" : "ghost", size: "icon" }))}
                onClick={() => onPageChange(item)}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            render={<button type="button" disabled={page >= totalPages} />}
            className={cn(buttonVariants({ variant: "ghost", size: "default" }), "max-sm:aspect-square max-sm:p-0")}
            onClick={() => {
              if (page < totalPages) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
