


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

function cleanField(value: string | null) {
  if (!value) return null;

  const cleaned = value
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;
  return cleaned;
}

function parseCustomerName(text: string) {
  const patterns = [
    /Customer\s+([A-Za-zÀ-ÿ' -]+,\s*[A-Za-zÀ-ÿ' -]+)/i,
    /Customer\s*\n\s*([^\n]+)/i,
    /Customer\s+([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const value = cleanField(extract(text, pattern));

    if (value) {
      const cleanedValue = value
        .split(/Customer email/i)[0]
        .split(/Customer phone/i)[0]
        .split(/Date/i)[0]
        .trim();

      if (cleanedValue.includes(",")) {
        const parts = cleanedValue
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        if (parts.length === 2) {
          const first = parts[1];
          const last = parts[0];

          return `${capitalize(first)} ${capitalize(last)}`;
        }
      }

      return capitalizeWords(cleanedValue);
    }
  }

  return null;
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function capitalizeWords(input: string) {
  return input
    .split(" ")
    .map((w) => capitalize(w))
    .join(" ");
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

  const customerName = parseCustomerName(normalizedText);

  const email = cleanField(
    extract(normalizedText, /Customer email\s+([^\s\n]+@[^\s\n]+)/i)
  );

  const phone = cleanField(extract(normalizedText, /Customer phone\s+([^\n]+)/i));
  const dateRaw = cleanField(extract(normalizedText, /Date\s+([^\n]+)/i));
  const paxRaw = cleanField(extract(normalizedText, /PAX\s+([^\n]+)/i));
  const product = cleanField(extract(normalizedText, /Rate\s+([^\n]+)/i));

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