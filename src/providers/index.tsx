import { ToastProvider } from "@/components/ui/toast";
import { TRPCReactProvider } from "@/trpc/client";

import { ThemeProvider } from "./theme-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TRPCReactProvider>
        <ToastProvider position="bottom-right">{children}</ToastProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
};
