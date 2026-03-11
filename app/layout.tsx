


import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallAppButton from "@/components/install-app-button";

export const metadata: Metadata = {
  title: "Alicantíssima",
  description: "Luggage Storage & Shower Lounge in Alicante",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alicantíssima",
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
        <main className="min-h-screen">{children}</main>
        <InstallAppButton />
      </body>
    </html>
  );
}