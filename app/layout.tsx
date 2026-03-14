


import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallAppButton from "@/components/install-app-button";
import IframeHeightReporter from "@/components/iframe-height-reporter";
import RouteScrollReset from "@/components/route-scroll-reset";

export const metadata = {
  title: "Alicantissima",
  description: "Luggage Storage & Shower Lounge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alicantissima",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <RouteScrollReset />
        <IframeHeightReporter />
        <main className="min-h-screen">{children}</main>
        <InstallAppButton />
      </body>
    </html>
  );
}