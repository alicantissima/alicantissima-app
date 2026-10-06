function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function timeStringToMinutes(value: string) {
  const normalized = value.trim().replace("H", "h").replace("h", ":");
  const [hourRaw, minuteRaw] = normalized.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;

  return hour * 60 + minute;
}

function getMadridDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function generateTimeSlots(startHour: number, endHour: number) {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const startH = hour;
      const startM = minute;

      let endH = hour;
      let endM = minute + 30;

      if (endM === 60) {
        endH += 1;
        endM = 0;
      }

      const start = `${pad(startH)}h${pad(startM)}`;
      const end = `${pad(endH)}h${pad(endM)}`;

      slots.push(`${start}-${end}`);
    }
  }

  return slots;
}

// Low season: 10:00-20:00 through 31 March 2027.
// From 1 April 2027 the full 10:00-22:00 schedule is automatically restored.
export const LOW_SEASON_LAST_DATE = "2027-03-31";
export const LOW_SEASON_CLOSING_TIME = "20:00";
export const HIGH_SEASON_CLOSING_TIME = "22:00";

export function getClosingTimeForDate(date?: string) {
  const effectiveDate = date || getMadridDateString();

  return effectiveDate <= LOW_SEASON_LAST_DATE
    ? LOW_SEASON_CLOSING_TIME
    : HIGH_SEASON_CLOSING_TIME;
}

export function getSlotStartTime(slot: string) {
  return slot.split("-")[0] || "";
}

export function isTimeSlotSelectable(slot: string, date?: string) {
  const slotStartMinutes = timeStringToMinutes(getSlotStartTime(slot));
  const closingMinutes = timeStringToMinutes(getClosingTimeForDate(date));

  return slotStartMinutes < closingMinutes;
}

export function getTimeSlotLabel(slot: string, date?: string) {
  return isTimeSlotSelectable(slot, date) ? slot : `${slot} · Unavailable`;
}

// Master list remains 10:00-22:00 so low-season closed slots stay visible.
export const TIME_SLOTS = generateTimeSlots(10, 22);
