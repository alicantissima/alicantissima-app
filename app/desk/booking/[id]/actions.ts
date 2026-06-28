


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
} from "@/lib/showers";

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

function getShowerQuantityFromMeta(
  quantity: number | null | undefined,
  meta: Record<string, unknown>
) {
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
        label.includes("ducha") ||
        label.includes("douche") ||
        label.includes("doccia") ||
        label.includes("dusche") ||
        label.includes("prysznic") ||
        label.includes("zuhany") ||
        label.includes("suihku") ||
        label.includes("dusj")
      ) {
        totalShowers += Number(part.quantity || 0);
      }
    });

    if (totalShowers > 0) return totalShowers;
  }

  return Number(quantity || 1);
}

function getProductTitle(type: ChangeProductInput["newType"]) {
  if (type === "luggage") return "Luggage Storage";
  if (type === "shower") return "Shower";
  return "Luggage + Shower";
}

async function getBookingSource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string
) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("source")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return booking?.source?.toLowerCase().trim() ?? "";
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

const bookingSource = await getBookingSource(supabase, bookingId);

if (bookingSource === "viator") {
  throw new Error("Viator bookings have locked prices and products.");
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

type UpdateQuantityInput = {
  bookingId: string;
  itemId: string;
  quantity: number;
};

export async function updateBookingItemQuantity({
  bookingId,
  itemId,
  quantity,
}: UpdateQuantityInput) {
  const supabase = await createClient();

  if (quantity < 1) return;

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

const bookingSource = await getBookingSource(supabase, bookingId);

if (bookingSource === "viator") {
  throw new Error("Viator bookings have locked prices and quantities.");
}

  const { data: item, error: itemError } = await supabase
    .from("booking_items")
    .select("*")
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .single();

  if (itemError) throw new Error(itemError.message);

  if (
    profile.role === "desk" &&
    item.product_type !== "booking" &&
    item.product_type !== "luggage"
  ) {
    throw new Error("Desk can only edit luggage quantities.");
  }

  const unitPrice = Number(item.unit_price || 0);
const newLineTotal = unitPrice * quantity;

let newMeta = item.meta || {};

if (item.product_type === "combo") {
  const comboTotal = 18 * quantity;
  const extraLuggageTotal = Math.max(0, newLineTotal - comboTotal);
  const extraLuggageQuantity = Math.round(extraLuggageTotal / 8);

  newMeta = {
    ...newMeta,
    breakdown: [
      {
        label: "Luggage + Shower",
        quantity,
        unitPrice: 18,
        totalPrice: comboTotal,
      },
      ...(extraLuggageQuantity > 0
        ? [
            {
              label: "Additional luggage",
              quantity: extraLuggageQuantity,
              unitPrice: 8,
              totalPrice: extraLuggageQuantity * 8,
            },
          ]
        : []),
    ],
  };
}

  await supabase
    .from("booking_items")
    .update({
      quantity,
      line_total: newLineTotal,
      meta: newMeta,
    })
    .eq("id", itemId)
    .eq("booking_id", bookingId);

  const { data: items } = await supabase
    .from("booking_items")
    .select("line_total")
    .eq("booking_id", bookingId);

  const newTotal = (items || []).reduce(
    (sum, i) => sum + Number(i.line_total || 0),
    0
  );

  await supabase
    .from("bookings")
    .update({ total_amount: newTotal })
    .eq("id", bookingId);

  revalidatePath(`/desk/booking/${bookingId}`);
}

type UpdateShowerTimeInput = {
  bookingId: string;
  itemId: string;
  showerTime: string;
};

export async function updateBookingItemShowerTime({
  bookingId,
  itemId,
  showerTime,
}: {
  bookingId: string;
  itemId: string;
  showerTime: string;
}) {
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
    .select("id, booking_id, quantity, meta")
    .eq("id", itemId)
    .eq("booking_id", bookingId)
    .single();

  if (itemError) {
    throw new Error(itemError.message);
  }

  const currentMeta =
    item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)
      ? (item.meta as Record<string, unknown>)
      : {};

  const showerQuantity = getShowerQuantityFromMeta(
  item.quantity,
  currentMeta
);

  const cleanShowerTime = showerTime.trim();

  const newMeta = {
    ...currentMeta,
    showerTime: cleanShowerTime || null,
    showerQuantity,
    showerDurationMinutes: cleanShowerTime
      ? getShowerDurationMinutes(showerQuantity)
      : null,
    showerEndTime: cleanShowerTime
      ? getShowerEndTime(cleanShowerTime, showerQuantity)
      : null,
    shower_room:
      typeof currentMeta.shower_room === "string" &&
      currentMeta.shower_room.trim()
        ? currentMeta.shower_room.trim()
        : "s1",
  };

  const { error: updateError } = await supabase
    .from("booking_items")
    .update({ meta: newMeta })
    .eq("id", itemId)
    .eq("booking_id", bookingId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath(`/desk/booking/${bookingId}`);
  revalidatePath(`/admin/booking/${bookingId}`);
  revalidatePath("/desk");
  revalidatePath("/admin");
}

type UpdateShowerRoomInput = {
  bookingId: string;
  itemId: string;
  showerRoom: "s1" | "s2";
};

export async function updateBookingItemShowerRoom({
  bookingId,
  itemId,
  showerRoom,
}: UpdateShowerRoomInput) {
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

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admin can edit shower room.");
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
    throw new Error("Booking item not found.");
  }

  const currentMeta =
    item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)
      ? (item.meta as Record<string, unknown>)
      : {};

  const newMeta = {
    ...currentMeta,
    shower_room: showerRoom,
  };

  const { error: updateError } = await supabase
    .from("booking_items")
    .update({ meta: newMeta })
    .eq("id", itemId)
    .eq("booking_id", bookingId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath(`/desk/booking/${bookingId}`);
  revalidatePath(`/admin/booking/${bookingId}`);
  revalidatePath("/desk");
  revalidatePath("/admin");
}