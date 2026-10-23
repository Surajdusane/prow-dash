"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

/**
 * Client-side error boundary for the Devices route. Lives in its own client
 * component so the fallback can retry (the page itself is a server component
 * and cannot pass a render function down to the library boundary).
 */
export function DevicesErrorBoundary({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <Card>
          <CardPanel>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Couldn&apos;t load Devices</EmptyTitle>
                <EmptyDescription>
                  The fleet request failed. This is usually a cold database - try again.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={resetErrorBoundary}>
                  Retry
                </Button>
              </EmptyContent>
            </Empty>
          </CardPanel>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
