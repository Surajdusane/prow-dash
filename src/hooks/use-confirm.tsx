"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  /** Short, specific heading, e.g. "Delete ticket?". */
  title: string;
  /** Supporting copy that explains the consequence. */
  description?: string;
  /** Confirm button label. Defaults to "Confirm". */
  confirmText?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelText?: string;
  /** `"destructive"` (default) styles the confirm button for high-risk actions. */
  variant?: "default" | "destructive";
}

type ConfirmHandler = (options: ConfirmOptions) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

/**
 * Promise-based confirmation. Resolves `true` when the user confirms and
 * `false` when they cancel or dismiss the dialog (or when no
 * `<ConfirmationDialog />` is mounted).
 *
 * Usage: `if (await confirm({ title: "Delete lead?" })) { remove() }`
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (!confirmHandler) {
    return Promise.resolve(false);
  }

  return confirmHandler(options);
}

/**
 * Trigger-less confirmation alert dialog. Mount once per app area
 * (the dashboard layout does this) and drive it with `confirm()`.
 */
export function ConfirmationDialog(): React.ReactElement {
  const [request, setRequest] = React.useState<ConfirmOptions | null>(null);
  const [open, setOpen] = React.useState(false);
  const pendingResolve = React.useRef<((confirmed: boolean) => void) | null>(null);

  React.useEffect(() => {
    confirmHandler = (options) =>
      new Promise<boolean>((resolve) => {
        // A new confirmation supersedes any in-flight request.
        pendingResolve.current?.(false);
        pendingResolve.current = resolve;
        setRequest(options);
        setOpen(true);
      });

    return () => {
      confirmHandler = null;
      pendingResolve.current?.(false);
      pendingResolve.current = null;
    };
  }, []);

  const settle = (confirmed: boolean) => {
    pendingResolve.current?.(confirmed);
    pendingResolve.current = null;
    setOpen(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          settle(false);
        }
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title ?? "Confirm action"}</AlertDialogTitle>
          {request?.description ? <AlertDialogDescription>{request.description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} onClick={() => settle(false)}>
            {request?.cancelText ?? "Cancel"}
          </AlertDialogClose>
          <AlertDialogClose
            render={<Button variant={request?.variant === "default" ? "default" : "destructive"} />}
            onClick={() => settle(true)}
          >
            {request?.confirmText ?? "Confirm"}
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
