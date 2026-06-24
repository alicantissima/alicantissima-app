


export function getShowerDurationMinutes(quantity: number) {
  if (!quantity || quantity <= 1) return 15;
  if (quantity <= 4) return 30;
  if (quantity <= 7) return 45;
  return 60;
}

export function getShowerDurationLabel(quantity: number) {
  const minutes = getShowerDurationMinutes(quantity);

  if (minutes === 15) return "15 minutes";
  if (minutes === 30) return "30 minutes";
  if (minutes === 45) return "45 minutes";
  if (minutes === 60) return "1 hour";

  return `${minutes} minutes`;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getShowerEndTime(startTime: string, quantity: number) {
  const startMinutes = timeToMinutes(startTime);
  const duration = getShowerDurationMinutes(quantity);

  return minutesToTime(startMinutes + duration);
}

export function getShowerTimeRange(startTime: string, quantity: number) {
  const endTime = getShowerEndTime(startTime, quantity);
  return `${startTime} - ${endTime}`;
}

/**
 * Double shower rooms logic
 */

export type ShowerRoom = 1 | 2;

export const SHOWER_ROOMS: ShowerRoom[] = [1, 2];

export function normalizeTime(time?: string | null) {
  if (!time) return "";

  // Supabase time fields can come as HH:mm:ss.
  // The app usually works with HH:mm.
  return time.slice(0, 5);
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const aStart = normalizeTime(startA);
  const aEnd = normalizeTime(endA);
  const bStart = normalizeTime(startB);
  const bEnd = normalizeTime(endB);

  return aStart < bEnd && aEnd > bStart;
}

type ExistingShowerBooking = {
  shower_room?: number | null;
  product_type?: string | null;
  meta?: any;
};

type ShowerBlock = {
  shower_room: number;
  start_time: string;
  end_time: string;
};

export function getFreeShowerRoom({
  startTime,
  endTime,
  existingBookings,
  showerBlocks,
  ignoreBookingItemId,
}: {
  startTime: string;
  endTime: string;
  existingBookings: ExistingShowerBooking[];
  showerBlocks: ShowerBlock[];
  ignoreBookingItemId?: string | null;
}): ShowerRoom | null {
  for (const room of SHOWER_ROOMS) {
    const roomBlocked = showerBlocks.some((block) => {
      return (
        block.shower_room === room &&
        timesOverlap(startTime, endTime, block.start_time, block.end_time)
      );
    });

    if (roomBlocked) continue;

    const roomBooked = existingBookings.some((item: any) => {
      if (ignoreBookingItemId && item.id === ignoreBookingItemId) {
        return false;
      }

      if (item.product_type !== "shower" && item.product_type !== "combo") {
        return false;
      }

      const itemRoom = item.shower_room ?? 1;
      const itemStart = item.meta?.showerTime;
      const itemEnd = item.meta?.showerEndTime;

      if (!itemRoom || !itemStart || !itemEnd) return false;

      return (
        itemRoom === room &&
        timesOverlap(startTime, endTime, itemStart, itemEnd)
      );
    });

    if (!roomBooked) {
      return room;
    }
  }

  return null;
}

export function getShowerRoomLabel(room?: number | null) {
  if (!room) return "";
  return `S${room}`;
}