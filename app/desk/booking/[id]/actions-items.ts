


"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
  timesOverlap,
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

  const { data: item, error: itemError } = await supabase
    .from("booking_items")
    .select("id, booking_id, quantity, product_type, meta, shower_room")
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
      ? (item.meta as Record<string, unknown>)
      : {};

  const cleanValue = value.trim() || null;

  let newMeta: Record<string, unknown> = {
    ...currentMeta,
    [field]: cleanValue,
  };

  let normalizedRoom: 1 | 2 | null =
    item.shower_room === 1 || item.shower_room === 2
      ? item.shower_room
      : null;

  const metaRoom = String(currentMeta.shower_room || "")
    .trim()
    .toLowerCase();

  if (!normalizedRoom) {
    if (metaRoom === "s1" || metaRoom === "1") normalizedRoom = 1;
    if (metaRoom === "s2" || metaRoom === "2") normalizedRoom = 2;
  }

  if (field === "showerTime") {
    if (cleanValue) {
      const showerQuantity = getShowerQuantityFromItem({
        quantity: item.quantity,
        meta: currentMeta,
      });

      const showerEndTime = getShowerEndTime(
        cleanValue,
        showerQuantity
      );

      if (!normalizedRoom) {
        throw new Error(
          "This shower has no room assigned. Choose S1 or S2 first."
        );
      }

      /*
       * Descobrir a data da reserva.
       */
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("service_date")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      if (!booking?.service_date) {
        throw new Error("Booking service date not found.");
      }

      /*
       * Procurar todos os duches activos desse dia.
       */
      const { data: otherItems, error: availabilityError } =
        await supabase
          .from("booking_items")
          .select(`
            id,
            shower_room,
            product_type,
            meta,
            booking:bookings!inner (
              id,
              status,
              payment_status,
              payment_expires_at,
              service_date
            )
          `)
          .eq("booking.service_date", booking.service_date)
          .not(
            "booking.status",
            "in",
            '("cancelled","no_show","completed")'
          );

      if (availabilityError) {
        throw new Error(availabilityError.message);
      }

      const nowIso = new Date().toISOString();

      const conflict = (otherItems ?? []).some((other: any) => {
        /*
         * A própria linha nunca entra em conflito consigo mesma.
         */
        if (other.id === itemId) return false;

        if (
          other.product_type !== "shower" &&
          other.product_type !== "combo"
        ) {
          return false;
        }

        const otherBooking = other.booking;

        if (!otherBooking) return false;

        const status = otherBooking.status;
        const paymentStatus = otherBooking.payment_status;
        const paymentExpiresAt = otherBooking.payment_expires_at;

        const active =
          status === "booked" ||
          status === "inside" ||
          ((status === "pending_payment" ||
            paymentStatus === "pending_payment") &&
            Boolean(
              paymentExpiresAt &&
                paymentExpiresAt > nowIso
            ));

        if (!active) return false;

        const otherMeta =
          other.meta &&
          typeof other.meta === "object" &&
          !Array.isArray(other.meta)
            ? (other.meta as Record<string, unknown>)
            : {};

        const otherMetaRoom = String(
          otherMeta.shower_room || ""
        )
          .trim()
          .toLowerCase();

        const otherRoom =
          otherMetaRoom === "s1" || otherMetaRoom === "1"
            ? 1
            : otherMetaRoom === "s2" || otherMetaRoom === "2"
            ? 2
            : other.shower_room === 1 || other.shower_room === 2
            ? other.shower_room
            : null;

        if (otherRoom !== normalizedRoom) {
          return false;
        }

        const otherStart =
          typeof otherMeta.showerTime === "string"
            ? otherMeta.showerTime
            : "";

        const otherEnd =
          typeof otherMeta.showerEndTime === "string"
            ? otherMeta.showerEndTime
            : "";

        if (!otherStart || !otherEnd) {
          return false;
        }

        return timesOverlap(
          cleanValue,
          showerEndTime,
          otherStart,
          otherEnd
        );
      });

      if (conflict) {
        throw new Error(
          `S${normalizedRoom} is already occupied during this time.`
        );
      }

      newMeta = {
        ...newMeta,
        showerQuantity,
        showerDurationMinutes:
          getShowerDurationMinutes(showerQuantity),
        showerEndTime,
        shower_room: `s${normalizedRoom}`,
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
    .update({
      meta: newMeta,

      ...(field === "showerTime" && normalizedRoom
        ? { shower_room: normalizedRoom }
        : {}),
    })
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