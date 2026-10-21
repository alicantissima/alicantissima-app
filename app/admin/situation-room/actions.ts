"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getBookingPaymentModeState,
  type BookingPaymentMode,
} from "@/lib/booking-payment-mode";

export async function setBookingPaymentModeAction(
  requestedMode: BookingPaymentMode,
  confirmation: string
): Promise<{ ok: boolean; message: string }> {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) return { ok: false, message: "Please sign in again." };

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { ok: false, message: "Admin access is required." };
  }

  if (requestedMode !== "online" && requestedMode !== "on_arrival") {
    return { ok: false, message: "Invalid payment mode." };
  }

  const expectedConfirmation =
    requestedMode === "online" ? "RESTORE" : "SOS";

  if (confirmation !== expectedConfirmation) {
    return { ok: false, message: "Confirmation did not match." };
  }

  const state = await getBookingPaymentModeState();
  if (!state.databaseReady) {
    return {
      ok: false,
      message: "Situation Room database migration is required before switching modes.",
    };
  }

  if (state.mode === requestedMode) {
    return { ok: true, message: "This mode is already active." };
  }

  const { error } = await createAdminClient().rpc("set_booking_payment_mode", {
    p_mode: requestedMode,
    p_actor: user.id,
  });

  if (error) {
    console.error("Situation Room mode switch failed:", error);
    return {
      ok: false,
      message: "Could not switch the mode. No change confirmed.",
    };
  }

  revalidatePath("/admin/situation-room");
  revalidatePath("/checkout");

  return {
    ok: true,
    message:
      requestedMode === "online"
        ? "NORMAL mode activated. New site bookings use Revolut."
        : "SOS mode activated. New site bookings are paid on arrival.",
  };
}
