


"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { sendPushToAll } from "@/lib/push/send-push";

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
    const showerTime = formatTimeRange(item.meta?.showerTime);
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
  const showerTime = formatTimeRange(item.meta?.showerTime);
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
  lines.push(t.paymentOnSite);

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
      const showerTime = formatTimeRange(item.meta?.showerTime);
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

          <p style="margin:0; font-size:15px; line-height:23px; color:#ea580c;">
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
    const showerTime = formatTimeRange(item.meta?.showerTime);
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

function normalizeSource(value?: string) {
  const source = (value || "").trim().toLowerCase();

  if (source === "walkin") return "walkin";
  if (source === "viator") return "viator";
  if (source === "booking") return "booking";
  if (source === "site") return "site";

  return "site";
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

      return {
        id: item.id,
        title: item.title.trim(),
        quantity,
        unitPrice,
        totalPrice,
        productType: item.productType ?? "booking",
        meta: item.meta ?? {},
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const supabase = createAdminClient();
    const bookingCode = generateBookingCode();
    const serviceDate = getServiceDateFromItems(items);

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
    payment_method: "unpaid",
    status: "booked",
    service_date: serviceDate,
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

    try {
  await sendBookingConfirmationEmail({
    customerName,
    customerEmail,
    bookingCode: booking.booking_code,
    bookingUrl: customerBookingUrl,
    qrCodeUrl,
    items: items.map((item) => ({
  title: item.title,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  totalPrice: item.totalPrice,
  productType: item.productType,
  meta: item.meta,
})),
totalAmount,
notes,
language,
  });
} catch (emailError) {
  console.error("booking confirmation email error:", emailError);
}

try {
  await sendInternalBookingNotification({
    customerName,
    customerCity,
    customerEmail,
    customerPhone,
    bookingCode: booking.booking_code,
    bookingUrl: adminBookingUrl,
    qrCodeUrl,
    items: items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      meta: item.meta,
    })),
    totalAmount,
    notes,
  });
} catch (internalEmailError) {
  console.error("internal booking notification email error:", internalEmailError);
}

try {
  const firstItem = items[0];

  const time =
    typeof firstItem?.meta?.dropOffTime === "string"
      ? firstItem.meta.dropOffTime
      : typeof firstItem?.meta?.showerTime === "string"
        ? firstItem.meta.showerTime
        : "";

  await sendPushToAll({
    title: "Nova reserva Alicantíssima 🔔",
    body: `${booking.booking_code} · ${firstItem?.title || "Booking"}${
      time ? ` · ${time}` : ""
    } · €${totalAmount.toFixed(2)}`,
    url: `/desk/booking/${booking.id}`,
  });
} catch (pushError) {
  console.error("push notification error:", pushError);
}

    return {
      ok: true,
      bookingCode: booking.booking_code,
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