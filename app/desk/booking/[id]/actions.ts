


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

  const cleanValue = value.trim();

  const { data: updatedBooking, error } = await supabase
    .from("bookings")
    .update({ [field]: cleanValue || null })
    .eq("id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!updatedBooking) {
    throw new Error(
      "Field update blocked. Check bookings update policy for desk role."
    );
  }

  revalidatePath(`/desk/booking/${bookingId}`);
}