


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
} from "@/lib/showers";

type UpdateTimeInput = {
  bookingId: string;
  itemId: string;
  field: "dropOffTime" | "pickUpTime" | "showerTime";
  value: string;
};

function getShowerQuantityFromItem(item: {
  quantity?: number | null;
  meta?: Record<string, unknown> | null;
}) {
  const meta = item.meta ?? {};

  const storedShowerQuantity = Number(meta.showerQuantity);
  if (Number.isFinite(storedShowerQuantity) && storedShowerQuantity > 0) {
    return storedShowerQuantity;
  }

  const breakdown = meta.breakdown;

  if (Array.isArray(breakdown)) {
    let totalShowers = 0;

    breakdown.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;

      const part = entry as {
        label?: unknown;
        quantity?: unknown;
      };

      const label = String(part.label || "").toLowerCase();

      if (
        label.includes("shower") ||
        label.includes("duche") ||
        label.includes("ducha")
      ) {
        totalShowers += Number(part.quantity || 0);
      }
    });

    if (totalShowers > 0) return totalShowers;
  }

  return Number(item.quantity || 1);
}

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

if (profile.role === "desk" && field === "showerTime") {
  throw new Error("Desk cannot edit shower times.");
}

  const { data: item, error: itemError } = await supabase
    .from("booking_items")
    .select("id, booking_id, quantity, product_type, meta")
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (!item) {
    throw new Error("Booking item not found or access blocked");
  }

if (
  profile.role === "desk" &&
  (item.product_type === "shower" || item.product_type === "combo")
) {
  throw new Error("Desk cannot edit shower or combo times.");
}

  const currentMeta =
    item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)
      ? (item.meta as Record<string, unknown>)
      : {};

  const cleanValue = value.trim() || null;

  let newMeta: Record<string, unknown> = {
    ...currentMeta,
    [field]: cleanValue,
  };

  if (field === "showerTime") {
    if (cleanValue) {
      const showerQuantity = getShowerQuantityFromItem({
        quantity: item.quantity,
        meta: currentMeta,
      });

      newMeta = {
  ...newMeta,
  showerQuantity,
  showerDurationMinutes: getShowerDurationMinutes(showerQuantity),
  showerEndTime: getShowerEndTime(cleanValue, showerQuantity),
  shower_room:
    typeof currentMeta.shower_room === "string" &&
    currentMeta.shower_room.trim()
      ? currentMeta.shower_room
      : "s1",
};
    } else {
      newMeta = {
        ...newMeta,
        showerQuantity: null,
        showerDurationMinutes: null,
        showerEndTime: null,
      };
    }
  }

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
  revalidatePath(`/admin/booking/${bookingId}`);
  revalidatePath("/desk");
  revalidatePath("/admin");
}