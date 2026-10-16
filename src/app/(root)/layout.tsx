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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ProWater · Internal Ops Dashboard",
    template: "ProWater · %s",
  },
  description: "Internal ops dashboard for ProWater — piped RO water subscriptions across Bangalore.",
  openGraph: {
    type: "website",
    siteName: "ProWater Dashboard",
    title: "ProWater · Internal Ops Dashboard",
    description: "Internal ops dashboard for ProWater — piped RO water subscriptions across Bangalore.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ProWater internal ops dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProWater · Internal Ops Dashboard",
    description: "Internal ops dashboard for ProWater — piped RO water subscriptions across Bangalore.",
    images: ["/og.png"],
  },
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
