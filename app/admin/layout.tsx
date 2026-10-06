import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alicantissima Admin",
  manifest: "/admin/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
