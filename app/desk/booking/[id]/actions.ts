


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type UpdateBookingFieldInput = {
  bookingId: string;
  field: "city" | "customer_phone" | "customer_email";
  value: string;
};

export async function updateBookingField({
  bookingId,
  field,
  value,
}: UpdateBookingFieldInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "desk")) {
    throw new Error("Unauthorized");
  }

  const cleanValue = value.trim();

  const { error } = await supabase
  .from("bookings")
  .update({ [field]: cleanValue || null })
  .eq("id", bookingId);

if (error) {
  console.error("updateBookingField error:", error);
  throw new Error(error.message);
}

  revalidatePath(`/desk/booking/${bookingId}`);
}