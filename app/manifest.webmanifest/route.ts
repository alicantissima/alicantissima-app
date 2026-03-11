


import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const manifest = {
    name: "Alicantíssima",
    short_name: "Alicantíssima",
    description: "Book luggage storage and showers in Alicante",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  });
}