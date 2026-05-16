


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