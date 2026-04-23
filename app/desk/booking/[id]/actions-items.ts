


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type UpdateTimeInput = {
  bookingId: string;
  itemId: string;
  field: "dropOffTime" | "pickUpTime" | "showerTime";
  value: string;
};

export async function updateBookingItemTime({
  bookingId,
  itemId,
  field,
  value,
}: UpdateTimeInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile || !["admin", "desk"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }

  const { data: item, error: itemError } = await supabase
    .from("booking_items")
    .select("id, booking_id, meta")
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (!item) {
    throw new Error("Booking item not found or access blocked");
  }

  const currentMeta =
    item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)
      ? item.meta
      : {};

  const newMeta = {
    ...currentMeta,
    [field]: value.trim() || null,
  };

  const { data: updatedItem, error: updateError } = await supabase
    .from("booking_items")
    .update({ meta: newMeta })
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updatedItem) {
    throw new Error(
      "Time update blocked. Check booking_items update policy for desk role."
    );
  }

  revalidatePath(`/desk/booking/${bookingId}`);
}