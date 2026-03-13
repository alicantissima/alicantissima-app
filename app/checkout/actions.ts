


"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
    lines.push(`${item.quantity} × ${item.title} - € ${formatPrice(item.totalPrice)}`);

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
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const lines: string[] = [];

  lines.push(`Hello ${params.customerName},`);
  lines.push("");
  lines.push("Your booking is confirmed.");
  lines.push("");
  lines.push(`Booking code: ${params.bookingCode}`);
  lines.push(`View your booking: ${params.bookingUrl}`);
  lines.push("");
  lines.push("Booking details:");
  lines.push(...buildBookingLines({ items: params.items }));
  lines.push("");
  lines.push(`Total: € ${formatPrice(params.totalAmount)}`);

  if (params.notes) {
    lines.push("");
    lines.push(`Notes: ${params.notes}`);
  }

  lines.push("");
  lines.push("Payment is made on site, by card or cash.");
  lines.push("");
  lines.push("Alicantissima | Luggage Storage & Shower Lounge");
  lines.push("Alicante");
  lines.push("");
  lines.push("Thank you!");

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

      return `
        <div style="margin:0 0 18px 0; padding:0 0 18px 0; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827; font-weight:700;">
            ${item.quantity} × ${item.title} - € ${formatPrice(item.totalPrice)}
          </p>
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
            Booking confirmed
          </h1>

          <p style="margin:0 0 16px 0; font-size:17px; line-height:26px; color:#111827;">
            Hello ${params.customerName},
          </p>

          <p style="margin:0 0 20px 0; font-size:17px; line-height:26px; color:#111827;">
            Your booking is confirmed.
          </p>

          <div style="margin:0 0 24px 0; padding:18px 20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:16px;">
            <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827;">
              <strong>Booking code:</strong> ${params.bookingCode}
            </p>
            <p style="margin:0; font-size:16px; line-height:24px;">
              <a href="${params.bookingUrl}" style="color:#0f766e; text-decoration:none; font-weight:700;">
                View your booking
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
            <p style="margin:0; font-size:14px; line-height:20px; color:#6b7280;">
              Show this QR code at check-in
            </p>
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

          <p style="margin:24px 0 0 0; font-size:16px; line-height:24px; color:#111827;">
            Payment is made on site, by card or cash.
          </p>

          <p style="margin:24px 0 0 0; font-size:16px; line-height:24px; color:#111827;">
            Alicantissima | Luggage Storage & Shower Lounge<br />
            Alicante
          </p>

          <p style="margin:24px 0 0 0; font-size:16px; line-height:24px; color:#111827;">
            Thank you!
          </p>
        </div>
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

      return `
        <div style="margin:0 0 18px 0; padding:0 0 18px 0; border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 8px 0; font-size:16px; line-height:24px; color:#111827; font-weight:700;">
            ${item.quantity} × ${item.title} - € ${formatPrice(item.totalPrice)}
          </p>
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
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const subject = `Alicantissima booking confirmed – ${params.bookingCode}`;

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

export async function submitCheckout(payload: CheckoutPayload) {
  try {
    const customerName = payload.customerName?.trim();
    const customerCity = payload.customerCity?.trim();
    const customerEmail = payload.customerEmail?.trim();
    const customerPhone = payload.customerPhone?.trim();
    const notes = payload.notes?.trim() || null;

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
  source: "na",
  status: "pending",
  service_date: serviceDate,
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
      meta: item.meta,
    })),
    totalAmount,
    notes,
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