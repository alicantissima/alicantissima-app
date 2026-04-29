

import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push/send-push";

export const runtime = "nodejs";

export async function GET() {
  await sendPushToAll({
    title: "Teste Alicantíssima 🔔",
    body: "As notificações push estão a funcionar.",
    url: "/desk",
  });

  return NextResponse.json({ success: true });
}