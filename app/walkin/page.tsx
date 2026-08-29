


import type { Metadata } from "next";
import HomeClient from "@/components/home-client";

export const metadata: Metadata = {
  title: "Alicantissima Walk-in",
  manifest: "/walkin/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WalkinPage() {
  return <HomeClient forcedSource="walkin" />;
}