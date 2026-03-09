


import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alicantíssima Desk",
  description: "Desk app for Alicantíssima operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}