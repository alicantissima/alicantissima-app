


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



type ChangeProductInput = {
  bookingId: string;
  itemId: string;
  newType: "luggage" | "shower" | "combo";
};

const PRICES = {
  luggage: 8,
  shower: 12,
  combo: 18,
};

function buildBreakdown(type: ChangeProductInput["newType"], quantity: number) {
  if (type === "combo") {
    return [
      {
        label: "Luggage + Shower",
        quantity,
        unitPrice: 18,
        totalPrice: 18 * quantity,
      },
    ];
  }

  return [];
}

function getProductTitle(type: ChangeProductInput["newType"]) {
  if (type === "luggage") return "Luggage Storage";
  if (type === "shower") return "Shower";
  return "Luggage + Shower";
}

export async function changeBookingItemProduct({
  bookingId,
  itemId,
  newType,
}: ChangeProductInput) {
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
    .select("*")
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .single();

  if (itemError) {
    throw new Error(itemError.message);
  }

  const quantity = item.quantity || 1;
  const unitPrice = PRICES[newType];
  const lineTotal = unitPrice * quantity;

  const newMeta = {
    ...(item.meta || {}),
    breakdown: buildBreakdown(newType, quantity),
  };

  if (newType === "luggage") {
    newMeta.showerTime = null;
  }

  const { error: updateItemError } = await supabase
    .from("booking_items")
    .update({
      product_type: newType,
      title: getProductTitle(newType),
      unit_price: unitPrice,
      line_total: lineTotal,
      meta: newMeta,
    })
    .eq("id", itemId)
    .eq("booking_id", bookingId);

  if (updateItemError) {
    throw new Error(updateItemError.message);
  }

  const { data: items, error: itemsError } = await supabase
    .from("booking_items")
    .select("line_total")
    .eq("booking_id", bookingId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const newTotal = (items || []).reduce(
    (sum, currentItem) => sum + Number(currentItem.line_total || 0),
    0
  );

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ total_amount: newTotal })
    .eq("id", bookingId);

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  revalidatePath(`/desk/booking/${bookingId}`);
}


