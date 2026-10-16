import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { RootProvider } from "fumadocs-ui/provider/next";

import "./globals.css";

import { Providers } from "@/providers";

import { cn } from "@/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ProWater Dashboard",
    template: "%s · ProWater Dashboard",
  },
  description: "Internal ops dashboard for ProWater — piped RO water subscriptions across Bangalore.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        interHeading.variable
      )}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <RootProvider theme={{ enabled: false }}>
          <Providers>{children}</Providers>
        </RootProvider>
      </body>
    </html>
  );
}
