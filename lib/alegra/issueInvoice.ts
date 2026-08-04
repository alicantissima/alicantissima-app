


import { createAdminClient } from "@/lib/supabase/admin";

import { createAlegraContact } from "@/lib/alegra/contacts";

import {
  createAlegraInvoice,
  extractAlegraInvoiceNumber,
  extractAlegraInvoicePdfUrl,
  getAlegraInvoiceWithPdf,
} from "@/lib/alegra/invoices";

import { buildAlegraInvoicePayment } from "@/lib/alegra/payments";

import type {
  AlegraId,
  AlegraInvoiceIssueResult,
  AlegraInvoiceItemInput,
  AlegraProductConfig,
  BookingForAlegraInvoice,
  BookingItemForAlegraInvoice,
  CreateAlegraInvoiceInput,
} from "@/lib/alegra/types";

const INVOICE_PROVIDER = "alegra";
const IVA_RATE = 21;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}.`);
  }

  return value;
}

function cleanText(value: unknown) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function normalizeEmail(value: unknown) {
  return cleanText(value)?.toLowerCase() ?? null;
}

function toPositiveNumber(value: unknown, fieldName: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(
      `Invalid ${fieldName}: ${String(value)}.`
    );
  }

  return number;
}

function roundToSixDecimals(value: number) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function priceWithoutTax(priceWithTax: number) {
  return roundToSixDecimals(
    priceWithTax / (1 + IVA_RATE / 100)
  );
}

function getMadridDate(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to calculate the Alegra invoice date.");
  }

  return `${year}-${month}-${day}`;
}

function getProductConfig(
  productType: string | null
): AlegraProductConfig {
  const normalized = String(productType ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized === "luggage" ||
    normalized === "lugg"
  ) {
    return {
      itemId: requiredEnv("ALEGRA_ITEM_LUGGAGE_ID"),
      reference: "LUGG",
      description: "Luggage Storage",
    };
  }

  if (
    normalized === "shower" ||
    normalized === "shw"
  ) {
    return {
      itemId: requiredEnv("ALEGRA_ITEM_SHOWER_ID"),
      reference: "SHW",
      description: "Shower Service",
    };
  }

  if (
    normalized === "combo" ||
    normalized === "luggage_shower" ||
    normalized === "luggage+shower" ||
    normalized === "lugg+shw"
  ) {
    return {
      itemId: requiredEnv("ALEGRA_ITEM_COMBO_ID"),
      reference: "LUGG+SHW",
      description: "Luggage + Shower",
    };
  }

  throw new Error(
    `Unsupported booking product_type for Alegra: "${String(
      productType
    )}".`
  );
}

function buildInvoiceItem(
  bookingItem: BookingItemForAlegraInvoice
): AlegraInvoiceItemInput {
  const product = getProductConfig(
    bookingItem.product_type
  );

  const quantity = toPositiveNumber(
    bookingItem.quantity,
    "booking item quantity"
  );

  const unitPriceWithTax = toPositiveNumber(
    bookingItem.unit_price,
    "booking item unit price"
  );

  return {
    id: product.itemId,
    quantity,
    price: priceWithoutTax(unitPriceWithTax),

    tax: [
      {
        id: requiredEnv("ALEGRA_TAX_ID"),
      },
    ],

    reference: product.reference,
    description:
      cleanText(bookingItem.title) ??
      product.description,
  };
}

async function acquireInvoiceLock(
  booking: BookingForAlegraInvoice
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("bookings")
    .update({
      invoice_provider: INVOICE_PROVIDER,
      invoice_status: "issuing",
      invoice_error: null,
    })
    .eq("id", booking.id)
    .is("invoice_id", null);

  if (booking.invoice_status) {
    query = query.eq(
      "invoice_status",
      booking.invoice_status
    );
  } else {
    query = query.is("invoice_status", null);
  }

  const { data, error } = await query
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to acquire invoice lock: ${error.message}`
    );
  }

  return Boolean(data?.id);
}

async function findReusableContactId(
  booking: BookingForAlegraInvoice
) {
  if (booking.alegra_contact_id) {
    return booking.alegra_contact_id;
  }

  const email = normalizeEmail(
    booking.customer_email
  );

  if (!email) {
    return null;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("alegra_contact_id")
    .ilike("customer_email", email)
    .not("alegra_contact_id", "is", null)
    .neq("id", booking.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to search reusable Alegra contact: ${error.message}`
    );
  }

  return cleanText(data?.alegra_contact_id);
}

async function resolveAlegraContactId(
  booking: BookingForAlegraInvoice
) {
  const reusableContactId =
    await findReusableContactId(booking);

  const supabase = createAdminClient();

  if (reusableContactId) {
    const { error } = await supabase
      .from("bookings")
      .update({
        alegra_contact_id: reusableContactId,
      })
      .eq("id", booking.id);

    if (error) {
      throw new Error(
        `Unable to save reused Alegra contact id: ${error.message}`
      );
    }

    return reusableContactId;
  }

  const contact = await createAlegraContact({
  name: booking.customer_name,
  email: booking.customer_email,
  phone: booking.customer_phone,
  bookingCode: booking.booking_code,
});

  const contactId = String(contact.id);

  const { error } = await supabase
    .from("bookings")
    .update({
      alegra_contact_id: contactId,
    })
    .eq("id", booking.id);

  if (error) {
    throw new Error(
      `Unable to save Alegra contact id: ${error.message}`
    );
  }

  return contactId;
}

async function loadBooking(bookingId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      customer_name,
      customer_email,
      customer_phone,
      total_amount,
      currency,
      service_date,
      source,
      payment_status,
      payment_reference,
      paid_at,
      invoice_provider,
      invoice_id,
      invoice_number,
      invoice_pdf_url,
      invoice_status,
      invoice_issued_at,
      invoice_error,
      alegra_contact_id
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load booking for invoice: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      `Booking not found: ${bookingId}.`
    );
  }

  return data as BookingForAlegraInvoice;
}

async function loadBookingItems(bookingId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("booking_items")
    .select(`
      id,
      booking_id,
      product_type,
      title,
      quantity,
      unit_price,
      line_total,
      meta
    `)
    .eq("booking_id", bookingId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load booking items for invoice: ${error.message}`
    );
  }

  if (!data?.length) {
    throw new Error(
      `Booking ${bookingId} has no booking_items.`
    );
  }

  return data as BookingItemForAlegraInvoice[];
}

async function saveInvoiceError(
  bookingId: string,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown Alegra invoice error.";

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      invoice_status: "error",
      invoice_error: message.slice(0, 5000),
    })
    .eq("id", bookingId)
    .is("invoice_id", null);

  if (updateError) {
    console.error(
      "Unable to save Alegra invoice error:",
      updateError
    );
  }
}

export async function issueAlegraInvoice(
  bookingId: string
): Promise<AlegraInvoiceIssueResult> {
  const normalizedBookingId =
    cleanText(bookingId);

  if (!normalizedBookingId) {
    throw new Error("Booking id is missing.");
  }

  let booking = await loadBooking(
    normalizedBookingId
  );

  if (booking.invoice_id) {
    return {
      ok: true,
      alreadyIssued: true,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      contactId:
        booking.alegra_contact_id ?? "",
      invoiceId: booking.invoice_id,
      invoiceNumber:
        booking.invoice_number,
      invoicePdfUrl:
        booking.invoice_pdf_url,
    };
  }

  if (
    String(booking.payment_status).toLowerCase() !==
    "paid"
  ) {
    throw new Error(
      `Booking ${booking.booking_code} is not paid. Current payment_status: ${booking.payment_status}.`
    );
  }

  if (
    String(booking.currency ?? "EUR").toUpperCase() !==
    "EUR"
  ) {
    throw new Error(
      `Unsupported invoice currency: ${booking.currency}.`
    );
  }

  if (booking.invoice_status === "issuing") {
    throw new Error(
      `Invoice for booking ${booking.booking_code} is already being issued.`
    );
  }

  const lockAcquired =
    await acquireInvoiceLock(booking);

  if (!lockAcquired) {
    booking = await loadBooking(
      normalizedBookingId
    );

    if (booking.invoice_id) {
      return {
        ok: true,
        alreadyIssued: true,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        contactId:
          booking.alegra_contact_id ?? "",
        invoiceId: booking.invoice_id,
        invoiceNumber:
          booking.invoice_number,
        invoicePdfUrl:
          booking.invoice_pdf_url,
      };
    }

    throw new Error(
      `Unable to acquire invoice lock for booking ${booking.booking_code}.`
    );
  }

  try {
    const bookingItems =
      await loadBookingItems(booking.id);

    const contactId =
      await resolveAlegraContactId(booking);

    const totalAmount = toPositiveNumber(
      booking.total_amount,
      "booking total_amount"
    );

    const invoiceDate = getMadridDate();

    const invoicePayload: CreateAlegraInvoiceInput =
      {
        date: invoiceDate,
        dueDate: invoiceDate,

        client: {
          id: contactId,
        },

        numberTemplate: {
          id: requiredEnv(
            "ALEGRA_NUMBER_TEMPLATE_ID"
          ),
        },

        items: bookingItems.map(
          buildInvoiceItem
        ),

        payments: [
          buildAlegraInvoicePayment({
            date: invoiceDate,
            amount: totalAmount,
            bankAccountId: requiredEnv(
              "ALEGRA_BANK_ACCOUNT_ID"
            ),
            bookingCode:
              booking.booking_code,
            paymentReference:
              booking.payment_reference,
          }),
        ],

        observations: [
          `Reserva: ${booking.booking_code}`,
          booking.payment_reference
            ? `Revolut: ${booking.payment_reference}`
            : null,
        ]
          .filter(Boolean)
          .join(" | "),
      };

    const invoice =
      await createAlegraInvoice(
        invoicePayload
      );

    const invoiceId = String(invoice.id);

    const invoiceNumber =
      extractAlegraInvoiceNumber(invoice);

    /*
     * Guardamos imediatamente o ID da fatura.
     *
     * A partir deste momento, mesmo que a obtenção do PDF falhe,
     * nunca tentaremos emitir uma segunda fatura.
     */
    const supabase = createAdminClient();

    const { error: saveInvoiceError } =
      await supabase
        .from("bookings")
        .update({
          invoice_provider:
            INVOICE_PROVIDER,
          invoice_id: invoiceId,
          invoice_number:
            invoiceNumber,
          invoice_status: "issued",
          invoice_issued_at:
            new Date().toISOString(),
          invoice_error: null,
        })
        .eq("id", booking.id);

    if (saveInvoiceError) {
      /*
       * Não alteramos para "error", porque a fatura
       * já existe efetivamente na Alegra.
       *
       * A booking fica em "issuing" para impedir
       * uma emissão automática duplicada.
       */
      throw new Error(
        `Alegra invoice ${invoiceId} was created, but could not be saved in booking ${booking.booking_code}: ${saveInvoiceError.message}`
      );
    }

    let invoicePdfUrl: string | null = null;

    try {
      const invoiceWithPdf =
        await getAlegraInvoiceWithPdf(
          invoiceId
        );

      invoicePdfUrl =
        extractAlegraInvoicePdfUrl(
          invoiceWithPdf
        );

      if (invoicePdfUrl) {
        const { error: pdfUpdateError } =
          await supabase
            .from("bookings")
            .update({
              invoice_pdf_url:
                invoicePdfUrl,
            })
            .eq("id", booking.id)
            .eq("invoice_id", invoiceId);

        if (pdfUpdateError) {
          console.error(
            "Unable to save Alegra invoice PDF URL:",
            pdfUpdateError
          );
        }
      }
    } catch (pdfError) {
      /*
       * O PDF é secundário.
       *
       * A fatura já está emitida e paga.
       * Uma falha ao obter a URL nunca deve provocar
       * uma segunda emissão.
       */
      console.error(
        "Unable to retrieve Alegra invoice PDF:",
        pdfError
      );
    }

    console.log(
      "ALEGRA INVOICE ISSUED:",
      {
        bookingId: booking.id,
        bookingCode:
          booking.booking_code,
        contactId,
        invoiceId,
        invoiceNumber,
        invoicePdfUrl,
      }
    );

    return {
      ok: true,
      alreadyIssued: false,
      bookingId: booking.id,
      bookingCode:
        booking.booking_code,
      contactId,
      invoiceId,
      invoiceNumber,
      invoicePdfUrl,
    };
  } catch (error) {
    /*
     * Apenas marcamos como erro se a fatura ainda
     * não tiver sido gravada na booking.
     */
    const currentBooking =
      await loadBooking(booking.id).catch(
        () => null
      );

    if (!currentBooking?.invoice_id) {
      await saveInvoiceError(
        booking.id,
        error
      );
    }

    throw error;
  }
}