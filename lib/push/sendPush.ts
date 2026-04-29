


import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

webpush.setVapidDetails(
  "mailto:bookings@alicantissima.es",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToAll(payload: PushPayload) {
  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("active", true);

  if (error) {
    console.error("Push subscriptions error:", error);
    return;
  }

  if (!subscriptions?.length) {
    console.log("No active push subscriptions");
    return;
  }

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/desk",
          })
        );
      } catch (err: any) {
        console.error("Push send error:", err);

        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .update({ active: false })
            .eq("id", sub.id);
        }
      }
    })
  );
}