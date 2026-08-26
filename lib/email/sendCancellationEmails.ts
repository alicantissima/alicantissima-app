

type CancellationEmailParams = {
  bookingCode: string;
  customerName?: string | null;
  customerEmail?: string | null;
  amount: number;
  currency?: string | null;
  reason?: string | null;
};

async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.BOOKING_FROM_EMAIL ||
    "Alicantissima <bookings@alicantissima.es>";

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

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Resend error: ${response.status} ${JSON.stringify(json)}`
    );
  }

  if (!json?.id) {
    throw new Error(
      `Resend success without id: ${JSON.stringify(json)}`
    );
  }

  return json;
}

function money(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export async function sendCancellationEmails({
  bookingCode,
  customerName,
  customerEmail,
  amount,
  currency = "EUR",
  reason,
}: CancellationEmailParams) {
  const formattedAmount = money(
    amount,
    String(currency || "EUR").toUpperCase()
  );

  /*
   * CUSTOMER EMAIL
   *
   * Only attempt it when the booking has a plausible email.
   */
  const email = String(customerEmail || "").trim();

  if (
    email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    const customerText = [
      "Booking cancelled",
      "",
      customerName
        ? `Hi ${customerName},`
        : "Hi,",
      "",
      `Your booking ${bookingCode} has been cancelled successfully.`,
      "",
      `Refund processed: ${formattedAmount}`,
      "",
      "The refund has been processed to your original payment method. Depending on your bank or card provider, it may take some time to appear in your account.",
      "",
      "Alicantissima | Luggage Storage & Shower Lounge",
    ].join("\n");

    const customerHtml = `
      <div style="margin:0;padding:0;background:#f5f5f5;">
        <div style="max-width:760px;margin:0 auto;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;">
          <div style="background:#ffffff;border-radius:28px;padding:44px 32px;">
            <h1 style="margin:0 0 24px;font-size:32px;line-height:40px;color:#111;">
              Booking cancelled
            </h1>

            <p style="font-size:17px;line-height:27px;color:#222;">
              ${
                customerName
                  ? `Hi ${customerName},`
                  : "Hi,"
              }
            </p>

            <p style="font-size:17px;line-height:27px;color:#222;">
              Your booking <strong>${bookingCode}</strong> has been cancelled successfully.
            </p>

            <div style="margin:28px 0;padding:22px 24px;background:#f7f7f7;border-radius:18px;">
              <div style="font-size:14px;color:#666;margin-bottom:7px;">
                Refund processed
              </div>

              <div style="font-size:28px;font-weight:700;color:#111;">
                ${formattedAmount}
              </div>
            </div>

            <p style="font-size:15px;line-height:24px;color:#5b6470;">
              The refund has been processed to your original payment method.
              Depending on your bank or card provider, it may take some time
              to appear in your account.
            </p>

            <p style="margin-top:32px;font-size:14px;color:#777;">
              Alicantissima | Luggage Storage & Shower Lounge
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Booking cancelled – ${bookingCode}`,
      text: customerText,
      html: customerHtml,
    });
  }

  /*
   * INTERNAL EMAIL
   */
  const internalEmail =
  process.env.BOOKING_NOTIFICATION_EMAIL ||
  process.env.BOOKING_ADMIN_EMAIL ||
  "desk@alicantissima.es";

  const internalText = [
    "Booking cancelled & refunded",
    "",
    `Booking: ${bookingCode}`,
    `Customer: ${customerName || "-"}`,
    `Email: ${email || "-"}`,
    `Refund: ${formattedAmount}`,
    `Reason: ${reason || "Customer cancelled online"}`,
    "",
    "The Revolut refund was processed successfully.",
  ].join("\n");

  const internalHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;padding:32px;">
      <h1>Booking cancelled &amp; refunded</h1>

      <div style="background:#f5f5f5;border-radius:18px;padding:22px 24px;">
        <p><strong>Booking:</strong> ${bookingCode}</p>
        <p><strong>Customer:</strong> ${customerName || "-"}</p>
        <p><strong>Email:</strong> ${email || "-"}</p>
        <p><strong>Refund:</strong> ${formattedAmount}</p>
        <p><strong>Reason:</strong> ${
          reason || "Customer cancelled online"
        }</p>
      </div>

      <p style="margin-top:24px;">
        The Revolut refund was processed successfully.
      </p>
    </div>
  `;

  await sendEmail({
    to: internalEmail,
    subject:
      `Booking cancelled & refunded – ${bookingCode} – ${formattedAmount}`,
    text: internalText,
    html: internalHtml,
  });
}