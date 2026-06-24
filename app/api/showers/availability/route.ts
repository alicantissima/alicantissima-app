


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getFreeShowerRoom,
  getShowerDurationMinutes,
  getShowerEndTime,
  timeToMinutes,
} from "@/lib/showers";

export const dynamic = "force-dynamic";

function timeToDisplay(time: string) {
  return time;
}

function getDynamicShowerSlotLabel(startTime: string, quantity: number) {
  const endTime = getShowerEndTime(startTime, quantity);
  return `${timeToDisplay(startTime)}-${timeToDisplay(endTime)}`;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generateShowerStartTimes(durationMinutes: number) {
  const openingMinutes = timeToMinutes("10:00");
  const closingMinutes = timeToMinutes("22:00");
  const stepMinutes = 15;

  const times: string[] = [];

  for (
    let start = openingMinutes;
    start + durationMinutes <= closingMinutes;
    start += stepMinutes
  ) {
    times.push(minutesToTime(start));
  }

  return times;
}

function getExistingShowerRange(item: {
  quantity: number | null;
  meta: Record<string, unknown> | null;
  shower_room?: number | null;
}) {
  const meta = item.meta ?? {};

  const showerTime =
    typeof meta.showerTime === "string" && meta.showerTime.trim()
      ? meta.showerTime
      : typeof meta.shower_time === "string" && meta.shower_time.trim()
        ? meta.shower_time
        : typeof meta.showerStartTime === "string" && meta.showerStartTime.trim()
          ? meta.showerStartTime
          : typeof meta.shower_start_time === "string" &&
              meta.shower_start_time.trim()
            ? meta.shower_start_time
            : "";

  if (!showerTime) return null;

  const quantity = Number(meta.showerQuantity || item.quantity || 1);

  const showerEndTime =
    typeof meta.showerEndTime === "string" && meta.showerEndTime.trim()
      ? meta.showerEndTime
      : typeof meta.shower_end_time === "string" && meta.shower_end_time.trim()
        ? meta.shower_end_time
        : getShowerEndTime(showerTime, quantity);

  const start = timeToMinutes(showerTime);
  const end = timeToMinutes(showerEndTime);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  return {
    start,
    end,
    showerTime,
    showerEndTime,
    quantity,
    showerRoom: item.shower_room ?? null,
  };
}

function hasShowerTime(meta: Record<string, unknown> | null) {
  return Boolean(
    (typeof meta?.showerTime === "string" && meta.showerTime.trim()) ||
      (typeof meta?.shower_time === "string" && meta.shower_time.trim()) ||
      (typeof meta?.showerStartTime === "string" &&
        meta.showerStartTime.trim()) ||
      (typeof meta?.shower_start_time === "string" &&
        meta.shower_start_time.trim())
  );
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const date = searchParams.get("date") || "";
    const quantity = Number(searchParams.get("quantity") || "1");
    const excludeBookingId = searchParams.get("excludeBookingId") || "";

    if (!date) {
      return NextResponse.json(
        { ok: false, error: "Missing date." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid quantity." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("booking_items")
      .select(
        `
        id,
        quantity,
        product_type,
        title,
        meta,
        shower_room,
        booking:bookings!inner (
          id,
          status,
          service_date,
          payment_status,
          payment_expires_at
        )
      `
      )
      .eq("booking.service_date", date)
      .not("booking.status", "in", '("cancelled","no_show","completed")');

    if (error) {
      console.error("showers availability error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: showerBlocks, error: showerBlocksError } = await supabase
      .from("shower_blocks")
      .select("id, shower_room, start_time, end_time, reason")
      .eq("service_date", date);

    if (showerBlocksError) {
      console.error("shower blocks availability error:", showerBlocksError);
      return NextResponse.json(
        { ok: false, error: showerBlocksError.message },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();

    const activeItems =
      data?.filter((item: any) => {
        const booking = item.booking;

        if (!booking) return false;

        if (excludeBookingId && booking.id === excludeBookingId) {
          return false;
        }

        const status = booking.status;
        const paymentStatus = booking.payment_status;
        const paymentExpiresAt = booking.payment_expires_at;

        if (
          status === "cancelled" ||
          status === "no_show" ||
          status === "completed"
        ) {
          return false;
        }

        if (status === "booked" || status === "inside") {
          return true;
        }

        if (status === "pending_payment" || paymentStatus === "pending_payment") {
          return Boolean(paymentExpiresAt && paymentExpiresAt > nowIso);
        }

        return false;
      }) ?? [];

    const existingShowerItems = activeItems.filter((item: any) => {
      const meta = item.meta as Record<string, unknown> | null;

      return (
        (item.product_type === "shower" || item.product_type === "combo") &&
        hasShowerTime(meta)
      );
    });

    const existingRanges = existingShowerItems
      .map((item: any) =>
        getExistingShowerRange({
          quantity: item.quantity,
          meta: item.meta as Record<string, unknown> | null,
          shower_room: item.shower_room,
        })
      )
      .filter((value) => value !== null);

    const requestedDuration = getShowerDurationMinutes(quantity);
    const startTimes = generateShowerStartTimes(requestedDuration);

    const slots = startTimes.map((startTime) => {
      const endTime = getShowerEndTime(startTime, quantity);

      const availableRoom = getFreeShowerRoom({
        startTime,
        endTime,
        existingBookings: existingShowerItems,
        showerBlocks: showerBlocks ?? [],
      });

      const isAvailable = availableRoom !== null;
      const baseLabel = getDynamicShowerSlotLabel(startTime, quantity);

      return {
        value: startTime,
        label: isAvailable ? baseLabel : `${baseLabel} · Reserved`,
        startTime,
        endTime,
        available: isAvailable,
        availableRoom,
      };
    });

    return NextResponse.json({
      ok: true,
      date,
      quantity,
      durationMinutes: requestedDuration,
      slots,
      existing: existingRanges,
      showerBlocks: showerBlocks ?? [],
    });
  } catch (error) {
    console.error("showers availability unexpected error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected availability error.",
      },
      { status: 500 }
    );
  }
}