


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
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
  const closingMinutes = timeToMinutes("19:00");
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

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && startB < endA;
}

function getExistingShowerRange(item: {
  quantity: number | null;
  meta: Record<string, unknown> | null;
}) {
  const meta = item.meta ?? {};

  const showerTime =
    typeof meta.showerTime === "string" ? meta.showerTime : "";

  if (!showerTime) return null;

  const quantity = Number(item.quantity || 1);

  const showerEndTime =
    typeof meta.showerEndTime === "string" && meta.showerEndTime
      ? meta.showerEndTime
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
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const date = searchParams.get("date") || "";
    const quantity = Number(searchParams.get("quantity") || "1");

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
    bookings!inner (
      id,
      status,
      service_date
    )
  `
  )
  .eq("bookings.service_date", date)
  .not("bookings.status", "in", '("cancelled","no_show")');

    if (error) {
      console.error("showers availability error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const existingRanges =
  data
    ?.filter((item) => {
      const meta = item.meta as Record<string, unknown> | null;
      return typeof meta?.showerTime === "string" && meta.showerTime;
    })
    .map((item) =>
      getExistingShowerRange({
        quantity: item.quantity,
        meta: item.meta as Record<string, unknown> | null,
      })
    )
    .filter((value) => value !== null) ?? [];

    const requestedDuration = getShowerDurationMinutes(quantity);

    const startTimes = generateShowerStartTimes(requestedDuration);

const slots = startTimes.map((startTime) => {
  const endTime = getShowerEndTime(startTime, quantity);

  const requestedStart = timeToMinutes(startTime);
  const requestedEnd = requestedStart + requestedDuration;

  const isBlocked = existingRanges.some((range) =>
    rangesOverlap(requestedStart, requestedEnd, range.start, range.end)
  );

  const baseLabel = getDynamicShowerSlotLabel(startTime, quantity);

  return {
    value: startTime,
    label: isBlocked ? `${baseLabel} · Reserved` : baseLabel,
    startTime,
    endTime,
    available: !isBlocked,
  };
});

    return NextResponse.json({
      ok: true,
      date,
      quantity,
      durationMinutes: requestedDuration,
      slots,
      existing: existingRanges,
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