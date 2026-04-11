


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

  const { data: item } = await supabase
    .from("booking_items")
    .select("meta")
    .eq("id", itemId)
    .single();

  const currentMeta = item?.meta ?? {};

  const newMeta = {
    ...currentMeta,
    [field]: value || null,
  };

  const { error } = await supabase
    .from("booking_items")
    .update({ meta: newMeta })
    .eq("id", itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/desk/booking/${bookingId}`);
}