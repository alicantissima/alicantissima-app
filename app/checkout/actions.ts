


"use server";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { sendPushToAll } from "@/lib/push/send-push";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
  timeToMinutes,
} from "@/lib/showers";

type CheckoutItem = {
  id: string;
  title: string;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  productType?: string;
  meta?: Record<string, unknown>;
};

type CheckoutPayload = {
  customerName: string;
  customerCity: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  language?: string;
  source?: string;
  items: CheckoutItem[];
};

function generateBookingCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALI-${random}`;
}

function generateCancellationToken() {
  return randomBytes(32).toString("hex");
}

function isFutureDate(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function getServiceDateFromItems(items: Array<{ meta?: Record<string, unknown> }>) {
  const firstDate = items.find((item) => {
    const date = item.meta?.date;
    return typeof date === "string" && date.trim();
  })?.meta?.date;

  if (typeof firstDate === "string" && firstDate.trim()) {
    return firstDate;
  }

  return new Date().toISOString().split("T")[0];
}

function formatHumanDate(dateValue: unknown) {
  if (typeof dateValue !== "string" || !dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeRange(value: unknown) {
  if (typeof value !== "string" || !value) return "";

  return value
    .replace(/h/g, ":")
    .replace(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/, "$1:$2 – $3:$4");
}

function formatShowerDuration(value: unknown) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) return "";

  if (minutes === 60) return "1 hour";

  return `${minutes} minutes`;
}

function getReservedForPeople(item: {
  quantity: number;
  meta?: Record<string, unknown>;
}) {
  const metaShowerQuantity = Number(item.meta?.showerQuantity);

if (Number.isFinite(metaShowerQuantity) && metaShowerQuantity > 0) {
  return metaShowerQuantity;
}

  const breakdown = getBreakdown(item.meta);

  if (breakdown.length > 0) {
    return breakdown.reduce((sum, part) => {
      const label = part.label.toLowerCase();

      if (
        label.includes("shower") ||
        label.includes("duche") ||
        label.includes("ducha")
      ) {
        return sum + Number(part.quantity || 0);
      }

      return sum;
    }, 0);
  }

  return item.quantity;
}

function formatReservedForPeople(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) return "";

  return quantity === 1 ? "1 person" : `${quantity} people`;
}

function formatShowerTimeRange(meta?: Record<string, unknown>) {
  const showerStart = formatTimeRange(meta?.showerTime);
  const showerEnd = formatTimeRange(meta?.showerEndTime);

  if (showerStart && showerEnd) {
    return `${showerStart} – ${showerEnd}`;
  }

  return showerStart;
}

function getQrCodeUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(text)}`;
}

function getLocalizedProductTitle(params: {
  productType?: string;
  fallbackTitle: string;
  language?: string;
}) {
  const t = getMessages(params.language);

  if (params.productType === "booking") return t.bookLuggageProductName;
  if (params.productType === "shower") return t.bookShowerProductName;
  if (params.productType === "combo") return t.bookComboProductName;

  return params.fallbackTitle;
}

type BookingBreakdownItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

function getBreakdown(meta?: Record<string, unknown>): BookingBreakdownItem[] {
  const raw = meta?.breakdown;

  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const item = entry as Record<string, unknown>;

      const label =
        typeof item.label === "string" ? item.label.trim() : "";

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const totalPrice = Number(item.totalPrice);

      if (!label) return null;
      if (!Number.isFinite(quantity)) return null;
      if (!Number.isFinite(unitPrice)) return null;
      if (!Number.isFinite(totalPrice)) return null;

      return {
        label,
        quantity,
        unitPrice,
        totalPrice,
      };
    })
    .filter((value): value is BookingBreakdownItem => value !== null);
}

function buildBookingLines(params: {
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
}) {
  const lines: string[] = [];

  params.items.forEach((item) => {
    const breakdown = getBreakdown(item.meta);

    if (breakdown.length > 0) {
      breakdown.forEach((part) => {
        lines.push(
          `${part.quantity} × ${part.label} - € ${formatPrice(part.totalPrice)}`
        );
      });
    } else {
      lines.push(
        `${item.quantity} × ${item.title} - € ${formatPrice(item.totalPrice)}`
      );
    }

    const date = formatHumanDate(item.meta?.date);
    const dropOffTime = formatTimeRange(item.meta?.dropOffTime);
    const pickUpTime = formatTimeRange(item.meta?.pickUpTime);
    const showerTime = formatShowerTimeRange(item.meta);
const showerDuration = formatShowerDuration(item.meta?.showerDurationMinutes);
const reservedForPeople = showerTime
  ? formatReservedForPeople(getReservedForPeople(item))
  : "";
const comments = item.meta?.comments;

    if (date) {
      lines.push(`Date: ${date}`);
    }

    if (dropOffTime) {
      lines.push(`Drop-off: ${dropOffTime}`);
    }

    if (pickUpTime) {
      lines.push(`Estimated pick-up: ${pickUpTime}`);
    }

    if (showerTime) {
  lines.push(`Shower time: ${showerTime}`);
}

if (reservedForPeople) {
  lines.push(`Reserved for: ${reservedForPeople}`);
}

if (showerDuration) {
  lines.push(`Total group duration: ${showerDuration}`);
}

    if (typeof comments === "string" && comments.trim()) {
      lines.push(`Comments: ${comments.trim()}`);
    }

    lines.push("");
  });

  while (lines.length && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines;
}

function buildConfirmationEmailText(params: {
  customerName: string;
  bookingCode: string;
  bookingUrl: string;
  cancellationUrl?: string | null;
  cancelUntil?: string | null;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productType?: string;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
  language?: string;
}) {
  const t = getMessages(params.language);
  const lines: string[] = [];

  lines.push(`${t.bookingConfirmedTitle}`);
  lines.push("");
  lines.push(`${t.thankYouBookingCodePrefix} ${params.bookingCode}.`);
  lines.push("");
  lines.push(`${t.bookingSummary}`);
  lines.push("");
  lines.push(`${t.nameLabel} ${params.customerName}`);

  params.items.forEach((item) => {
  const productTitle = getLocalizedProductTitle({
    productType: item.productType,
    fallbackTitle: item.title,
    language: params.language,
  });

  const breakdown = getBreakdown(item.meta);
  const date = formatHumanDate(item.meta?.date);
  const dropOffTime = formatTimeRange(item.meta?.dropOffTime);
  const pickUpTime = formatTimeRange(item.meta?.pickUpTime);
  const showerTime = formatShowerTimeRange(item.meta);
const showerDuration = formatShowerDuration(item.meta?.showerDurationMinutes);
const reservedForPeople = showerTime
  ? formatReservedForPeople(getReservedForPeople(item))
  : "";
const comments = item.meta?.comments;

  if (breakdown.length > 0) {
  breakdown.forEach((part) => {
    lines.push(`${part.label} - € ${formatPrice(part.totalPrice)}`);
    lines.push(`${t.qtyLabel}: ${part.quantity}`);
  });
} else {
    lines.push(`${productTitle} - € ${formatPrice(item.totalPrice)}`);
    lines.push(`${t.qtyLabel}: ${item.quantity}`);
  }

  if (date) lines.push(`${t.dateLabel} ${date}`);
  if (dropOffTime) lines.push(`${t.dropOffLabel} ${dropOffTime}`);
  if (pickUpTime) lines.push(`${t.estimatedPickUpLabel} ${pickUpTime}`);
  if (showerTime) lines.push(`${t.showerTimeLabel} ${showerTime}`);
if (reservedForPeople) lines.push(`Reserved for: ${reservedForPeople}`);
if (showerDuration) lines.push(`Total group duration: ${showerDuration}`);

  if (typeof comments === "string" && comments.trim()) {
    lines.push(`${t.commentsLabel}: ${comments.trim()}`);
  }

  lines.push("");
});

const totalItemsAll = params.items.reduce((sum, item) => {
  const breakdown = getBreakdown(item.meta);

  if (breakdown.length > 0) {
    return (
      sum +
      breakdown.reduce(
        (innerSum, part) => innerSum + Number(part.quantity || 0),
        0
      )
    );
  }

  return sum + Number(item.quantity || 0);
}, 0);

lines.push(`Total items: ${totalItemsAll}`);

  lines.push(`${t.totalLabel} € ${formatPrice(params.totalAmount)}`);
  lines.push("");
  lines.push("Payment confirmed online.");

if (params.cancellationUrl) {
  lines.push("");
  lines.push("Free cancellation");
  lines.push(
    params.cancelUntil
      ? `You can cancel this booking for free until ${formatHumanDate(
          params.cancelUntil.split("T")[0]
        )}.`
      : "You can cancel this booking for free up to 24 hours before your booking time."
  );
  lines.push(`Cancel booking: ${params.cancellationUrl}`);
}

  if (params.notes) {
    lines.push("");
    lines.push(`${t.notes}: ${params.notes}`);
  }

  lines.push("");
  lines.push(`${t.checkInQrTitle}`);
  lines.push(t.showQrAtReception);
  lines.push("");
  lines.push(`${t.openInApp}: ${params.bookingUrl}`);
  lines.push("");
  lines.push("Alicantissima | Luggage Storage & Shower Lounge");

  return lines.join("\n");
}

function buildConfirmationEmailHtml(params: {
  customerName: string;
  bookingCode: string;
  bookingUrl: string;
  cancellationUrl?: string | null;
  cancelUntil?: string | null;
  qrCodeUrl: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productType?: string;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
  language?: string;
}) {
  const t = getMessages(params.language);

  const itemBlocks = params.items
    .map((item) => {
      const productTitle = getLocalizedProductTitle({
        productType: item.productType,
        fallbackTitle: item.title,
        language: params.language,
      });

      const breakdown = getBreakdown(item.meta);
      const date = formatHumanDate(item.meta?.date);
      const dropOffTime = formatTimeRange(item.meta?.dropOffTime);
      const pickUpTime = formatTimeRange(item.meta?.pickUpTime);
      const showerTime = formatShowerTimeRange(item.meta);
const showerDuration = formatShowerDuration(item.meta?.showerDurationMinutes);
const reservedForPeople = showerTime
  ? formatReservedForPeople(getReservedForPeople(item))
  : "";
const comments =
        typeof item.meta?.comments === "string"
          ? item.meta.comments.trim()
          : "";

      const titleBlock =
  breakdown.length > 0
    ? breakdown
        .map(
          (part) => `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
              <tr>
                <td style="font-size:16px; line-height:24px; color:#111827; font-weight:700;">
                  ${part.label}
                </td>
                <td align="right" style="font-size:16px; line-height:24px; color:#111827; font-weight:700; white-space:nowrap;">
                  € ${formatPrice(part.totalPrice)}
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px 0; font-size:14px; line-height:21px; color:#6b7280;">
              ${t.qtyLabel}: ${part.quantity}
            </p>
          `
        )
        .join("")
    : `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:16px; line-height:24px; color:#111827; font-weight:700;">
              ${productTitle}
            </td>
            <td align="right" style="font-size:16px; line-height:24px; color:#111827; font-weight:700; white-space:nowrap;">
              € ${formatPrice(item.totalPrice)}
            </td>
          </tr>
        </table>
        <p style="margin:6px 0 0 0; font-size:14px; line-height:21px; color:#6b7280;">
          ${t.qtyLabel}: ${item.quantity}
        </p>
      `;

      return `
        <div style="padding:0 0 18px 0; margin:0 0 18px 0; border-bottom:1px solid #d1d5db;">
          ${titleBlock}

          ${date ? `<p style="margin:12px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>${t.dateLabel}</strong> ${date}</p>` : ""}
          ${dropOffTime ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>${t.dropOffLabel}</strong> ${dropOffTime}</p>` : ""}
          ${pickUpTime ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>${t.estimatedPickUpLabel}</strong> ${pickUpTime}</p>` : ""}
          ${showerTime ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>${t.showerTimeLabel}</strong> ${showerTime}</p>` : ""}
${reservedForPeople ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>Reserved for:</strong> ${reservedForPeople}</p>` : ""}
${showerDuration ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>Total group duration:</strong> ${showerDuration}</p>` : ""}
${comments ? `<p style="margin:6px 0 0 0; font-size:15px; line-height:22px; color:#111827;"><strong>${t.commentsLabel}:</strong> ${comments}</p>` : ""}
        </div>
      `;
    })
    .join("");

  const totalItemsAll = params.items.reduce((sum, item) => {
    const breakdown = getBreakdown(item.meta);

    if (breakdown.length > 0) {
      return (
        sum +
        breakdown.reduce(
          (innerSum, part) => innerSum + Number(part.quantity || 0),
          0
        )
      );
    }

    return sum + Number(item.quantity || 0);
  }, 0);

  return `
    <div style="margin:0; padding:0; background:#f3f4f6;">
      <div style="max-width:680px; margin:0 auto; padding:24px 16px; font-family:Arial,Helvetica,sans-serif;">
        <div style="text-align:center; padding:4px 0 0 0;">
          <h1 style="margin:0 0 10px 0; font-size:26px; line-height:32px; color:#111827; font-weight:700;">
            ${t.bookingConfirmedTitle}
          </h1>

          <p style="margin:0 0 24px 0; font-size:16px; line-height:24px; color:#374151;">
            ${t.thankYouBookingCodePrefix} <strong>${params.bookingCode}</strong>.
          </p>
        </div>

        <div style="background:#ffffff; border:1.5px solid #111827; border-radius:22px; padding:24px 22px; margin:0 0 22px 0;">
          <h2 style="margin:0 0 20px 0; text-align:center; font-size:20px; line-height:26px; color:#111827; font-weight:700;">
            ${t.bookingSummary}
          </h2>

          <p style="margin:0 0 14px 0; font-size:15px; line-height:23px; color:#111827;">
            <strong>${t.nameLabel}</strong> ${params.customerName}
          </p>

          ${itemBlocks}

          <p style="margin:0 0 10px 0; font-size:14px; line-height:21px; color:#6b7280;">
  Total items: ${totalItemsAll}
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">
  <tr>
    <td style="font-size:17px; line-height:25px; color:#111827; font-weight:700;">
      ${t.totalLabel}
    </td>
    <td align="right" style="font-size:17px; line-height:25px; color:#111827; font-weight:700; white-space:nowrap;">
      € ${formatPrice(params.totalAmount)}
    </td>
  </tr>
</table>

          <p style="margin:0; font-size:15px; line-height:23px; color:#047857; font-weight:700;">
  Payment confirmed online.
</p>

${
  params.cancellationUrl
    ? `
      <div style="margin:18px 0 0 0; padding:16px 18px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:16px;">
        <p style="margin:0 0 8px 0; font-size:15px; line-height:23px; color:#14532d; font-weight:700;">
          Free cancellation
        </p>
        <p style="margin:0 0 12px 0; font-size:14px; line-height:21px; color:#166534;">
          You can cancel this booking for free up to 24 hours before your booking time.
        </p>
        <a
          href="${params.cancellationUrl}"
          style="display:inline-block; padding:12px 18px; border-radius:999px; background:#14532d; color:#ffffff; text-decoration:none; font-size:14px; line-height:20px; font-weight:700;"
        >
          Cancel booking and refund payment
        </a>
      </div>
    `
    : ""
}
            ${t.paymentOnSite}
          </p>

          ${
            params.notes
              ? `
            <p style="margin:16px 0 0 0; font-size:15px; line-height:23px; color:#374151;">
              <strong>${t.notes}:</strong> ${params.notes}
            </p>
          `
              : ""
          }
        </div>

        <div style="text-align:center; padding:0 0 8px 0; margin:0 0 22px 0;">
          <h2 style="margin:0 0 10px 0; font-size:18px; line-height:24px; color:#111827; font-weight:700;">
            ${t.checkInQrTitle}
          </h2>

          <p style="margin:0 0 16px 0; font-size:14px; line-height:21px; color:#6b7280;">
            ${t.showQrAtReception}
          </p>

          <div style="display:inline-block; background:#ffffff; border:1px solid #111827; border-radius:18px; padding:12px;">
            <img
              src="${params.qrCodeUrl}"
              alt="${t.qrAltPrefix} ${params.bookingCode}"
              width="220"
              height="220"
              style="display:block; margin:0 auto; border-radius:10px;"
            />
          </div>
        </div>

        <div style="text-align:center; margin:0 0 22px 0;">
          <a
            href="${params.bookingUrl}"
            style="display:inline-block; padding:14px 22px; border-radius:999px; background:#111827; color:#ffffff; text-decoration:none; font-size:15px; line-height:22px; font-weight:700;"
          >
            ${t.openInApp}
          </a>
        </div>

        <p style="margin:24px 0 0 0; text-align:center; font-size:14px; line-height:21px; color:#374151;">
          Alicantissima | Luggage Storage & Shower Lounge
        </p>
      </div>
    </div>
  `;
}

function buildInternalEmailText(params: {
  customerName: string;
  customerCity?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  bookingCode: string;
  bookingUrl: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const lines: string[] = [];

  lines.push("New booking received.");
  lines.push("");
  lines.push(`Booking code: ${params.bookingCode}`);
  lines.push(`Customer: ${params.customerName}`);
if (params.customerCity) {
  lines.push(`City: ${params.customerCity}`);
}
  lines.push(`Email: ${params.customerEmail}`);

  if (params.customerPhone) {
    lines.push(`Phone: ${params.customerPhone}`);
  }

  lines.push(`View booking: ${params.bookingUrl}`);
  lines.push("");
  lines.push("Booking details:");
  lines.push(...buildBookingLines({ items: params.items }));
  lines.push("");
  lines.push(`Total: € ${formatPrice(params.totalAmount)}`);

  if (params.notes) {
    lines.push("");
    lines.push(`Notes: ${params.notes}`);
  }

  return lines.join("\n");
}

function buildInternalEmailHtml(params: {
  customerName: string;
  customerCity?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  bookingCode: string;
  bookingUrl: string;
  qrCodeUrl: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const itemBlocks = params.items
  .map((item) => {
    const date = formatHumanDate(item.meta?.date);
    const dropOffTime = formatTimeRange(item.meta?.dropOffTime);
    const pickUpTime = formatTimeRange(item.meta?.pickUpTime);
    const showerTime = formatShowerTimeRange(item.meta);
const showerDuration = formatShowerDuration(item.meta?.showerDurationMinutes);
const reservedForPeople = showerTime
  ? formatReservedForPeople(getReservedForPeople(item))
  : "";
const comments =
      typeof item.meta?.comments === "string" ? item.meta.comments.trim() : "";
    const breakdown = getBreakdown(item.meta);

    const titleLines =
      breakdown.length > 0
        ? breakdown
            .map(
              (part) => `
                <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827; font-weight:700;">
                  ${part.quantity} × ${part.label} - € ${formatPrice(part.totalPrice)}
                </p>
              `
            )
            .join("")
        : `
            <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827; font-weight:700;">
              ${item.quantity} × ${item.title} - € ${formatPrice(item.totalPrice)}
            </p>
          `;

    return `
      <div style="margin:0 0 18px 0; padding:0 0 18px 0; border-bottom:1px solid #e5e7eb;">
        ${titleLines}
        ${date ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Date: ${date}</p>` : ""}
        ${dropOffTime ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Drop-off: ${dropOffTime}</p>` : ""}
        ${pickUpTime ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Estimated pick-up: ${pickUpTime}</p>` : ""}
        ${showerTime ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Shower time: ${showerTime}</p>` : ""}
${reservedForPeople ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Reserved for: ${reservedForPeople}</p>` : ""}
${showerDuration ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Total group duration: ${showerDuration}</p>` : ""}
${comments ? `<p style="margin:4px 0; font-size:15px; line-height:22px; color:#374151;">Comments: ${comments}</p>` : ""}
      </div>
    `;
  })
  .join("");

  return `
    <div style="margin:0; padding:0; background:#f7f7f2;">
      <div style="max-width:640px; margin:0 auto; padding:32px 20px;">
        <div style="background:#ffffff; border-radius:20px; padding:32px; border:1px solid #e5e7eb; font-family:Arial,Helvetica,sans-serif;">
          <h1 style="margin:0 0 18px 0; font-size:30px; line-height:36px; color:#111827;">
            New booking received
          </h1>

          <div style="margin:0 0 24px 0; padding:18px 20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:16px;">
            <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;"><strong>Booking code:</strong> ${params.bookingCode}</p>
            <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;"><strong>Customer:</strong> ${params.customerName}
</p>

${
  params.customerCity
    ? `<p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;"><strong>City:</strong> ${params.customerCity}</p>`
    : ""
}
            <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;"><strong>Email:</strong> ${params.customerEmail}</p>
            ${
              params.customerPhone
                ? `<p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;"><strong>Phone:</strong> ${params.customerPhone}</p>`
                : ""
            }
            <p style="margin:0; font-size:16px; line-height:24px;">
              <a href="${params.bookingUrl}" style="color:#0f766e; text-decoration:none; font-weight:700;">
                Open booking
              </a>
            </p>
          </div>

          <div style="text-align:center; margin:0 0 28px 0;">
            <img
              src="${params.qrCodeUrl}"
              alt="Booking QR Code"
              width="220"
              height="220"
              style="display:block; margin:0 auto 12px auto; border-radius:12px;"
            />
          </div>

          <h2 style="margin:0 0 16px 0; font-size:22px; line-height:28px; color:#111827;">
            Booking details
          </h2>

          ${itemBlocks}

          <div style="margin:24px 0 0 0; padding:18px 20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:16px;">
            <p style="margin:0; font-size:18px; line-height:28px; color:#111827; font-weight:700;">
              Total: € ${formatPrice(params.totalAmount)}
            </p>
          </div>

          ${
            params.notes
              ? `
            <p style="margin:20px 0 0 0; font-size:15px; line-height:24px; color:#374151;">
              <strong>Notes:</strong> ${params.notes}
            </p>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.BOOKING_FROM_EMAIL || "Alicantissima <bookings@alicantissima.es>";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status} ${responseText}`);
  }
}

async function sendBookingConfirmationEmail(params: {
  customerName: string;
  customerEmail: string;
  bookingCode: string;
  bookingUrl: string;
  qrCodeUrl: string;
  cancellationUrl?: string | null;
  cancelUntil?: string | null;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productType?: string;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
  language?: string;
}) {
  const subject = `Alicantissima booking confirmation – ${params.bookingCode}`;

  await sendEmail({
    to: params.customerEmail,
    subject,
    text: buildConfirmationEmailText(params),
    html: buildConfirmationEmailHtml(params),
  });
}

async function sendInternalBookingNotification(params: {
  customerName: string;
  customerCity?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  bookingCode: string;
  bookingUrl: string;
  qrCodeUrl: string;
  items: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const notificationEmail =
    process.env.BOOKING_NOTIFICATION_EMAIL || "info@alicantissima.es";

  const subject = `New booking received – ${params.bookingCode}`;

  await sendEmail({
    to: notificationEmail,
    subject,
    text: buildInternalEmailText(params),
    html: buildInternalEmailHtml(params),
  });
}

function getAppBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.alicantissima.es"
  ).replace(/\/$/, "");
}

function getCancelUntil(items: Array<{ meta?: Record<string, unknown> }>) {
  const first = items[0];
  const date = first?.meta?.date;
  const time =
    typeof first?.meta?.showerTime === "string"
      ? first.meta.showerTime
      : typeof first?.meta?.dropOffTime === "string"
        ? first.meta.dropOffTime
        : "10:00";

  if (typeof date !== "string") return null;

  const normalizedTime = time.replace("h", ":").split("-")[0];
  const cancelDate = new Date(`${date}T${normalizedTime}:00`);
  if (Number.isNaN(cancelDate.getTime())) return null;

  cancelDate.setHours(cancelDate.getHours() - 24);
  return cancelDate.toISOString();
}

async function createRevolutOrder(params: {
  amount: number;
  bookingCode: string;
  customerEmail: string;
  customerName: string;
  language: string;
}) {
  const secretKey = process.env.REVOLUT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("REVOLUT_SECRET_KEY is missing.");
  }

  const appBaseUrl = getAppBaseUrl();
  const amountInCents = Math.round(params.amount * 100);

  const response = await fetch("https://merchant.revolut.com/api/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Revolut-Api-Version": "2024-09-01",
    },
    body: JSON.stringify({
      amount: amountInCents,
      currency: "EUR",
      description: `Alicantissima booking ${params.bookingCode}`,
      redirect_url: `${appBaseUrl}/checkout/success?code=${encodeURIComponent(
        params.bookingCode
      )}&lang=${encodeURIComponent(params.language)}`,
      merchant_order_data: {
        reference: params.bookingCode,
      },
      metadata: {
        bookingCode: params.bookingCode,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
      },
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Revolut order error: ${response.status} ${JSON.stringify(data)}`);
  }

  return {
    orderId: data?.id as string,
    checkoutUrl: data?.checkout_url as string,
  };
}

function normalizeSource(value?: string) {
  const source = (value || "").trim().toLowerCase();

  if (source === "walkin") return "walkin";
  if (source === "viator") return "viator";
  if (source === "booking") return "booking";
  if (source === "site") return "site";

  return "site";
}

export async function finalizePaidBookingByPaymentReference(paymentReference: string) {
  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("payment_reference", paymentReference)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) return { ok: false, error: "Booking not found." };

  if (booking.payment_status !== "paid") {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "booked",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) throw updateError;
  }

  const { data: bookingItems, error: itemsError } = await supabase
    .from("booking_items")
    .select("*")
    .eq("booking_id", booking.id);

  if (itemsError) throw itemsError;

  const appBaseUrl = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.alicantissima.es"
  ).replace(/\/$/, "");

  const customerBookingUrl = `${appBaseUrl}/b/${booking.booking_code}`;
  const adminBookingUrl = `${appBaseUrl}/admin/booking/${booking.id}`;
  const qrCodeUrl = getQrCodeUrl(customerBookingUrl);
const cancellationUrl =
  booking.cancellation_token && isFutureDate(booking.cancel_until)
    ? `${appBaseUrl}/cancel-booking?code=${encodeURIComponent(
        booking.booking_code
      )}&token=${encodeURIComponent(booking.cancellation_token)}`
    : null;

  const items = (bookingItems ?? []).map((item) => ({
    title: item.title,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price || 0),
    totalPrice: Number(item.line_total || 0),
    productType: item.product_type,
    meta: (item.meta as Record<string, unknown>) ?? {},
  }));

  await sendBookingConfirmationEmail({
  customerName: booking.customer_name,
  customerEmail: booking.customer_email,
  bookingCode: booking.booking_code,
  bookingUrl: customerBookingUrl,
  qrCodeUrl,
  cancellationUrl,
  cancelUntil: booking.cancel_until,
  items,
  totalAmount: Number(booking.total_amount || 0),
  notes: booking.notes,
  language: booking.language,
});

  await sendInternalBookingNotification({
    customerName: booking.customer_name,
    customerCity: booking.city,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    bookingCode: booking.booking_code,
    bookingUrl: adminBookingUrl,
    qrCodeUrl,
    items,
    totalAmount: Number(booking.total_amount || 0),
    notes: booking.notes,
  });

  const firstItem = items[0];

  const time =
    typeof firstItem?.meta?.dropOffTime === "string"
      ? firstItem.meta.dropOffTime
      : typeof firstItem?.meta?.showerTime === "string"
        ? firstItem.meta.showerTime
        : "";

  await sendPushToAll({
    title: "Nova reserva paga Alicantíssima 💳",
    body: `${booking.booking_code} · ${firstItem?.title || "Booking"}${
      time ? ` · ${time}` : ""
    } · €${Number(booking.total_amount || 0).toFixed(2)}`,
    url: `/desk/booking/${booking.id}`,
  });

  return { ok: true, bookingCode: booking.booking_code };
}

export async function submitCheckout(payload: CheckoutPayload) {
  try {
    const customerName = payload.customerName?.trim();
    const customerCity = payload.customerCity?.trim();
    const customerEmail = payload.customerEmail?.trim();
    const customerPhone = payload.customerPhone?.trim();
    const notes = payload.notes?.trim() || null;
    const language = normalizeLanguage(payload.language);
    const source = normalizeSource(payload.source);
    const isWalkin = source === "walkin";

    if (!customerName) {
      return { ok: false, error: "Missing name." };
    }

    if (!customerEmail) {
      return { ok: false, error: "Missing email." };
    }

    const rawItems = payload.items ?? [];

    if (!rawItems.length) {
      return { ok: false, error: "Your booking is empty." };
    }

    const items = rawItems.map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const totalPrice = Number(item.totalPrice);

      if (!item.id) {
        throw new Error(`Item ${index + 1} is missing product id.`);
      }

      if (!item.title?.trim()) {
        throw new Error(`Item ${index + 1} is missing title.`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Item ${index + 1} has invalid quantity.`);
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Item ${index + 1} has invalid unit price.`);
      }

      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        throw new Error(`Item ${index + 1} has invalid total price.`);
      }

      const productType = item.productType ?? "booking";
const currentMeta = item.meta ?? {};

const showerTime =
  typeof currentMeta.showerTime === "string"
    ? currentMeta.showerTime
    : "";

const shouldApplyShowerDuration =
  (productType === "shower" || productType === "combo") && showerTime;

const showerQuantity = Number(
  currentMeta.showerQuantity || quantity || 1
);

const meta = shouldApplyShowerDuration
  ? {
      ...currentMeta,
      showerQuantity,
      showerDurationMinutes:
        getShowerDurationMinutes(showerQuantity),
      showerEndTime:
        getShowerEndTime(showerTime, showerQuantity),
    }
  : currentMeta;

return {
  id: item.id,
  title: item.title.trim(),
  quantity,
  unitPrice,
  totalPrice,
  productType,
  meta,
};
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const supabase = createAdminClient();
const bookingCode = generateBookingCode();
const serviceDate = getServiceDateFromItems(items);
const cancelUntil = getCancelUntil(items);
const cancellationToken = isWalkin ? null : generateCancellationToken();

const showerItems = items.filter(
  (item) =>
    (item.productType === "shower" ||
      item.productType === "combo") &&
    typeof item.meta?.showerTime === "string"
);

for (const item of showerItems) {
  const meta = item.meta ?? {};

  const showerTime =
    typeof meta.showerTime === "string"
      ? meta.showerTime
      : "";

  if (!showerTime) continue;

  const showerQuantity = Number(
    meta.showerQuantity || item.quantity || 1
  );

  const requestedStart =
    timeToMinutes(showerTime);

  const requestedEnd =
    timeToMinutes(
      getShowerEndTime(
        showerTime,
        showerQuantity
      )
    );

  const { data: existingItems } = await supabase
  .from("booking_items")
  .select(`
    quantity,
    meta,
    booking:bookings!inner (
      status,
      service_date,
      payment_status,
      payment_expires_at
    )
  `)
  .eq("booking.service_date", serviceDate)
  .not(
    "booking.status",
    "in",
    '("cancelled","no_show","completed")'
  );

const nowIso = new Date().toISOString();

const activeExistingItems = (existingItems ?? []).filter((existing: any) => {
  const booking = existing.booking;

  if (!booking) return false;

  const status = booking.status;
  const paymentStatus = booking.payment_status;
  const paymentExpiresAt = booking.payment_expires_at;

  if (status === "cancelled" || status === "no_show" || status === "completed") {
    return false;
  }

  if (status === "pending_payment" || paymentStatus === "pending_payment") {
    return Boolean(paymentExpiresAt && paymentExpiresAt > nowIso);
  }

  return status === "booked" || status === "inside";
});

  const hasConflict =
  activeExistingItems.some((existing) => {
      const existingMeta =
        (existing.meta as Record<string, unknown>) ?? {};

      const existingTime =
        typeof existingMeta.showerTime === "string"
          ? existingMeta.showerTime
          : "";

      if (!existingTime) return false;

      const existingQuantity = Number(
        existingMeta.showerQuantity ||
          existing.quantity ||
          1
      );

      const existingStart =
        timeToMinutes(existingTime);

      const existingEnd =
        timeToMinutes(
          getShowerEndTime(
            existingTime,
            existingQuantity
          )
        );

      return (
        requestedStart < existingEnd &&
        existingStart < requestedEnd
      );
    });

  if (hasConflict) {
    return {
      ok: false,
      error:
        "This shower slot was just booked by another customer.",
    };
  }
}

    const { data: booking, error: bookingError } = await supabase
  .from("bookings")
  .insert({
    booking_code: bookingCode,
    customer_name: customerName,
    city: customerCity,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    notes,
    total_amount: totalAmount,
    currency: "EUR",
    source,
    payment_method: isWalkin ? "unpaid" : "revolut",
status: isWalkin ? "booked" : "pending_payment",
payment_status: isWalkin ? "unpaid" : "pending_payment",
payment_provider: isWalkin ? "walkin" : "revolut",
cancel_until: isWalkin ? null : cancelUntil,
cancellation_token: isWalkin ? null : cancellationToken,
cancellation_token_expires_at: isWalkin ? null : cancelUntil,
payment_expires_at: isWalkin
  ? null
  : new Date(Date.now() + 5 * 60 * 1000).toISOString(),
service_date: serviceDate || new Date().toISOString().split("T")[0],
language,
  })
  .select("id, booking_code")
  .single();

    if (bookingError || !booking) {
      console.error("bookingError:", bookingError);
      return {
        ok: false,
        error: bookingError?.message || "Could not create booking.",
      };
    }

    const bookingItems = items.map((item) => ({
      booking_id: booking.id,
      product_id: item.id,
      product_type: item.productType,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.totalPrice,
      meta: item.meta,
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) {
      console.error("itemsError:", itemsError);

      await supabase.from("bookings").delete().eq("id", booking.id);

      return {
        ok: false,
        error: itemsError.message || "Booking created, but items failed.",
      };
    }

    const appBaseUrl =
  (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.alicantissima.es"
  ).replace(/\/$/, "");

const customerBookingUrl = `${appBaseUrl}/b/${booking.booking_code}`;
const adminBookingUrl = `${appBaseUrl}/admin/booking/${booking.id}`;
const qrCodeUrl = getQrCodeUrl(customerBookingUrl);

if (isWalkin) {
  return {
    ok: true,
    bookingCode: booking.booking_code,
  };
}

let revolutOrder: { orderId: string; checkoutUrl: string };

try {
  revolutOrder = await createRevolutOrder({
    amount: totalAmount,
    bookingCode: booking.booking_code,
    customerEmail,
    customerName,
    language,
  });
} catch (revolutError) {
  console.error("revolut order error:", revolutError);

  await supabase.from("bookings").delete().eq("id", booking.id);

  return {
    ok: false,
    error: "Could not start online payment.",
  };
}

await supabase
  .from("bookings")
  .update({
    payment_reference: revolutOrder.orderId,
    revolut_order_id: revolutOrder.orderId,
    payment_url: revolutOrder.checkoutUrl,
    revolut_checkout_url: revolutOrder.checkoutUrl,
  })
  .eq("id", booking.id);

return {
  ok: true,
  bookingCode: booking.booking_code,
  checkoutUrl: revolutOrder.checkoutUrl,
};

  } catch (error) {
    console.error("submitCheckout error:", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected checkout error.",
    };
  }
}