


export type ParsedBokunEmail = {
  bookingCode: string | null;
  extRef: string | null;
  bookingRef: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  serviceDate: string | null;
  paxRaw: string | null;
  quantity: number | null;
  product: string | null;
  productBookingRef: string | null;
  viatorAmount: number | null;
  rawText: string;
};

function extract(text: string, regex: RegExp) {
  const match = text.match(regex);
  return match?.[1]?.trim() || null;
}

function parseServiceDate(input: string | null) {
  if (!input) return null;

  const m = input.match(
    /(\d{1,2})\.(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*'?(\d{2})/i
  );
  if (!m) return null;

  const [, day, mon, yy] = m;

  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month = months[mon.slice(0, 3)];
  if (!month) return null;

  return `20${yy}-${month}-${day.padStart(2, "0")}`;
}

function parseQuantity(paxRaw: string | null) {
  if (!paxRaw) return null;
  const m = paxRaw.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

export function parseBokunEmail(text: string): ParsedBokunEmail {
  const normalizedText = text.replace(/\r/g, "");

  const bookingCode =
    extract(normalizedText, /\b(ALI-[A-Z0-9]+)\b/i) ||
    extract(normalizedText, /\((ALI-[A-Z0-9]+)\)/i) ||
    extract(normalizedText, /Product booking ref\.?\s*(ALI-[A-Z0-9]+)/i);

  const extRef = extract(normalizedText, /Ext\. booking ref\.?\s*(\d+)/i);
  const bookingRef = extract(normalizedText, /Booking ref\.?\s*([A-Z0-9-]+)/i);
  const productBookingRef = extract(
    normalizedText,
    /Product booking ref\.?\s*(ALI-[A-Z0-9]+)/i
  );
  const customerName = extract(normalizedText, /Customer\s+([^\n]+)/i);
  const email = extract(normalizedText, /Customer email\s+([^\n]+)/i);
  const phone = extract(normalizedText, /Customer phone\s+([^\n]+)/i);
  const dateRaw = extract(normalizedText, /Date\s+([^\n]+)/i);
  const paxRaw = extract(normalizedText, /PAX\s+([^\n]+)/i);
  const product = extract(normalizedText, /Rate\s+([^\n]+)/i);
  const amountRaw = extract(
    normalizedText,
    /Viator amount:\s*EUR\s*([0-9]+(?:\.[0-9]+)?)/i
  );

  return {
    bookingCode,
    extRef,
    bookingRef,
    customerName,
    email,
    phone,
    serviceDate: parseServiceDate(dateRaw),
    paxRaw,
    quantity: parseQuantity(paxRaw),
    product,
    productBookingRef,
    viatorAmount: amountRaw ? Number(amountRaw) : null,
    rawText: normalizedText,
  };
}