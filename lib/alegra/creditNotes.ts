


import { createAdminClient } from "@/lib/supabase/admin";
import { alegraRequest } from "@/lib/alegra/client";

import type {
  AlegraCreditNote,
  AlegraCreditNoteIssueResult,
  AlegraInvoiceItemInput,
  AlegraProductConfig,
  BookingItemForAlegraInvoice,
  CreateAlegraCreditNoteInput,
} from "@/lib/alegra/types";

const CREDIT_NOTE_PROVIDER = "alegra";
const IVA_RATE = 21;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}.`
    );
  }

  return value;
}

function requiredPositiveIntegerEnv(name: string) {
  const raw = requiredEnv(name);
  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid integer environment variable ${name}: ${raw}.`
    );
  }

  return value;
}

function cleanText(value: unknown) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function roundToSixDecimals(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 1_000_000
  ) / 1_000_000;
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

  const year =
    parts.find((part) => part.type === "year")
      ?.value;

  const month =
    parts.find((part) => part.type === "month")
      ?.value;

  const day =
    parts.find((part) => part.type === "day")
      ?.value;

  if (!year || !month || !day) {
    throw new Error(
      "Unable to calculate Alegra credit note date."
    );
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
      itemId: requiredEnv(
        "ALEGRA_ITEM_LUGGAGE_ID"
      ),
      reference: "LUGG",
      description: "Luggage Storage",
    };
  }

  if (
    normalized === "shower" ||
    normalized === "shw"
  ) {
    return {
      itemId: requiredEnv(
        "ALEGRA_ITEM_SHOWER_ID"
      ),
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
      itemId: requiredEnv(
        "ALEGRA_ITEM_COMBO_ID"
      ),
      reference: "LUGG+SHW",
      description: "Luggage + Shower",
    };
  }

  throw new Error(
    `Unsupported booking product_type for Alegra credit note: "${String(
      productType
    )}".`
  );
}

type BookingForCreditNote = {
  id: string;
  booking_code: string;

  total_amount: string | number;
  currency: string | null;

  source: string | null;
  payment_method: string | null;

  invoice_id: string | null;
  invoice_number: string | null;
  alegra_contact_id: string | null;

  refund_amount: string | number | null;

  credit_note_provider: string | null;
  credit_note_id: string | null;
  credit_note_number: string | null;
  credit_note_status: string | null;
  credit_note_issued_at: string | null;
  credit_note_error: string | null;
};

async function loadBooking(
  bookingId: string
): Promise<BookingForCreditNote> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      total_amount,
      currency,
      source,
      payment_method,
      invoice_id,
      invoice_number,
      alegra_contact_id,
      refund_amount,
      credit_note_provider,
      credit_note_id,
      credit_note_number,
      credit_note_status,
      credit_note_issued_at,
      credit_note_error
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load booking for Alegra credit note: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      `Booking not found: ${bookingId}.`
    );
  }

  return data as BookingForCreditNote;
}

async function loadBookingItems(
  bookingId: string
) {
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
      `Unable to load booking items for credit note: ${error.message}`
    );
  }

  if (!data?.length) {
    throw new Error(
      `Booking ${bookingId} has no booking_items.`
    );
  }

  return data as BookingItemForAlegraInvoice[];
}

async function acquireCreditNoteLock(
  booking: BookingForCreditNote
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("bookings")
    .update({
      credit_note_provider:
        CREDIT_NOTE_PROVIDER,
      credit_note_status: "issuing",
      credit_note_error: null,
    })
    .eq("id", booking.id)
    .is("credit_note_id", null);

  if (booking.credit_note_status) {
    query = query.eq(
      "credit_note_status",
      booking.credit_note_status
    );
  } else {
    query = query.is(
      "credit_note_status",
      null
    );
  }

  const { data, error } = await query
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to acquire credit note lock: ${error.message}`
    );
  }

  return Boolean(data?.id);
}

async function saveCreditNoteError(
  bookingId: string,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown Alegra credit note error.";

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      credit_note_status: "error",
      credit_note_error:
        message.slice(0, 5000),
    })
    .eq("id", bookingId)
    .is("credit_note_id", null);

  if (updateError) {
    console.error(
      "Unable to save Alegra credit note error:",
      updateError
    );
  }
}

function buildCreditNoteItems(params: {
  bookingItems: BookingItemForAlegraInvoice[];
  bookingTotal: number;
  refundAmount: number;
}): AlegraInvoiceItemInput[] {
  const {
    bookingItems,
    bookingTotal,
    refundAmount,
  } = params;

  /*
   * Refund total:
   * usamos exatamente os preços originais.
   *
   * Refund parcial:
   * distribuímos o montante devolvido
   * proporcionalmente pelas linhas da reserva.
   *
   * A última linha absorve os cêntimos residuais
   * para que a soma bruta corresponda exatamente
   * ao refund.
   */

  let grossAllocated = 0;

  return bookingItems.map(
    (bookingItem, index) => {
      const product = getProductConfig(
        bookingItem.product_type
      );

      const quantity = Number(
        bookingItem.quantity
      );

      const originalLineTotal = Number(
        bookingItem.line_total
      );

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          `Invalid credit note item quantity: ${bookingItem.quantity}.`
        );
      }

      if (
        !Number.isFinite(
          originalLineTotal
        ) ||
        originalLineTotal <= 0
      ) {
        throw new Error(
          `Invalid booking line total: ${bookingItem.line_total}.`
        );
      }

      const isLast =
        index === bookingItems.length - 1;

      let refundGrossForLine: number;

      if (isLast) {
        refundGrossForLine =
          roundMoney(
            refundAmount -
              grossAllocated
          );
      } else {
        const proportion =
          originalLineTotal /
          bookingTotal;

        refundGrossForLine =
          roundMoney(
            refundAmount *
              proportion
          );

        grossAllocated =
          roundMoney(
            grossAllocated +
              refundGrossForLine
          );
      }

      if (refundGrossForLine <= 0) {
        throw new Error(
          `Calculated refund line amount is invalid for booking item ${bookingItem.id}.`
        );
      }

      const refundGrossUnit =
        refundGrossForLine /
        quantity;

      return {
        id: product.itemId,

        quantity,

        price: priceWithoutTax(
          refundGrossUnit
        ),

        tax: [
          {
            id: requiredEnv(
              "ALEGRA_TAX_ID"
            ),
          },
        ],

        reference: product.reference,

        description:
          cleanText(
            bookingItem.title
          ) ??
          product.description,
      };
    }
  );
}

function extractCreditNoteNumber(
  creditNote: AlegraCreditNote
) {
  const direct = cleanText(
    creditNote.fullNumber
  );

  if (direct) {
    return direct;
  }

  const templateFullNumber =
    cleanText(
      creditNote.numberTemplate
        ?.fullNumber
    );

  if (templateFullNumber) {
    return templateFullNumber;
  }

  const prefix = cleanText(
    creditNote.numberTemplate?.prefix
  );

  const number = cleanText(
    String(
      creditNote.number ??
        creditNote.numberTemplate
          ?.number ??
        ""
    )
  );

  if (prefix && number) {
    return `${prefix}${number}`;
  }

  return number;
}

export async function issueAlegraCreditNote(
  bookingId: string,
  requestedRefundAmount?: number
): Promise<AlegraCreditNoteIssueResult> {
  const normalizedBookingId =
    cleanText(bookingId);

  if (!normalizedBookingId) {
    throw new Error(
      "Booking id is missing."
    );
  }

  let booking = await loadBooking(
    normalizedBookingId
  );

  /*
   * IDEMPOTÊNCIA:
   * se já existe rectificativa, nunca
   * criamos outra.
   */
  if (booking.credit_note_id) {
    return {
      ok: true,
      alreadyIssued: true,

      bookingId: booking.id,
      bookingCode:
        booking.booking_code,

      invoiceId:
        booking.invoice_id ?? "",

      creditNoteId:
        booking.credit_note_id,

      creditNoteNumber:
        booking.credit_note_number,

      refundAmount: Number(
        booking.refund_amount ?? 0
      ),
    };
  }

  if (!booking.invoice_id) {
    throw new Error(
      `Booking ${booking.booking_code} has no Alegra invoice to rectify.`
    );
  }

  if (
    String(
      booking.currency ?? "EUR"
    ).toUpperCase() !== "EUR"
  ) {
    throw new Error(
      `Unsupported credit note currency: ${booking.currency}.`
    );
  }

  const bookingTotal = Number(
    booking.total_amount
  );

  if (
    !Number.isFinite(bookingTotal) ||
    bookingTotal <= 0
  ) {
    throw new Error(
      `Invalid booking total: ${booking.total_amount}.`
    );
  }

  const refundAmount = roundMoney(
    requestedRefundAmount ??
      Number(
        booking.refund_amount ?? 0
      )
  );

  if (
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0
  ) {
    throw new Error(
      `Invalid refund amount: ${refundAmount}.`
    );
  }

  if (refundAmount > bookingTotal) {
    throw new Error(
      `Refund amount ${refundAmount} exceeds booking total ${bookingTotal}.`
    );
  }

  if (
    booking.credit_note_status ===
    "issuing"
  ) {
    throw new Error(
      `Credit note for booking ${booking.booking_code} is already being issued.`
    );
  }

  const lockAcquired =
    await acquireCreditNoteLock(
      booking
    );

  if (!lockAcquired) {
    booking = await loadBooking(
      normalizedBookingId
    );

    if (booking.credit_note_id) {
      return {
        ok: true,
        alreadyIssued: true,

        bookingId: booking.id,
        bookingCode:
          booking.booking_code,

        invoiceId:
          booking.invoice_id ?? "",

        creditNoteId:
          booking.credit_note_id,

        creditNoteNumber:
          booking.credit_note_number,

        refundAmount: Number(
          booking.refund_amount ?? 0
        ),
      };
    }

    throw new Error(
      `Unable to acquire credit note lock for booking ${booking.booking_code}.`
    );
  }

  try {
    const bookingItems =
      await loadBookingItems(
        booking.id
      );

    const contactId =
      booking.alegra_contact_id ||
      requiredEnv(
        "ALEGRA_PUBLIC_CONTACT_ID"
      );

    const creditNoteDate =
      getMadridDate();

    const items =
      buildCreditNoteItems({
        bookingItems,
        bookingTotal,
        refundAmount,
      });

    /*
     * Nesta primeira fase tratamos
     * refunds de reservas online Revolut.
     *
     * Cuenta Revolut = conta configurada
     * em ALEGRA_BANK_ACCOUNT_ID.
     */
    const refundAccountId =
      requiredPositiveIntegerEnv(
        "ALEGRA_BANK_ACCOUNT_ID"
      );

    const payload: CreateAlegraCreditNoteInput = {
  date: creditNoteDate,
  dueDate: creditNoteDate,

  client: {
    id: contactId,
  },

  numberTemplate: {
    id: requiredEnv(
      "ALEGRA_CREDIT_NOTE_NUMBER_TEMPLATE_ID"
    ),
  },

  items,

  invoices: [
    {
      id: Number(booking.invoice_id),
      amount: refundAmount,
    },
  ],

  type: "DIFFERENCE",

  cause: `Refund reserva ${booking.booking_code}`,

  refunds: [
    {
      date: creditNoteDate,
      account: refundAccountId,
      amount: refundAmount,
      observations:
        `Refund reserva ${booking.booking_code}`,
    },
  ],

  anotation:
    `Reembolso reserva ${booking.booking_code}`,

  observations: [
    `Reserva: ${booking.booking_code}`,
    booking.invoice_number
      ? `Factura original: ${booking.invoice_number}`
      : null,
    booking.invoice_id
      ? `Alegra invoice ID: ${booking.invoice_id}`
      : null,
  ]
    .filter(Boolean)
    .join(" | "),
};

    const creditNote =
      await alegraRequest<AlegraCreditNote>(
        "/credit-notes",
        {
          method: "POST",
          body: JSON.stringify(
            payload
          ),
        }
      );

    if (!creditNote?.id) {
      throw new Error(
        `Alegra created a credit note without returning an id: ${JSON.stringify(
          creditNote
        )}`
      );
    }

    /*
     * Daqui em diante a rectificativa
     * JÁ EXISTE NA ALEGRA.
     *
     * Guardamos imediatamente o ID para
     * impedir uma segunda emissão.
     */
    const creditNoteId =
      String(creditNote.id);

    const creditNoteNumber =
      extractCreditNoteNumber(
        creditNote
      );

    const supabase =
      createAdminClient();

    const {
      error: saveCreditNoteError,
    } = await supabase
      .from("bookings")
      .update({
        credit_note_provider:
          CREDIT_NOTE_PROVIDER,

        credit_note_id:
          creditNoteId,

        credit_note_number:
          creditNoteNumber,

        credit_note_status:
          "issued",

        credit_note_issued_at:
          new Date().toISOString(),

        credit_note_error: null,
      })
      .eq("id", booking.id);

    if (saveCreditNoteError) {
      /*
       * NÃO passamos para "error":
       * a nota já existe fiscalmente.
       *
       * Mantendo "issuing", impedimos
       * uma emissão automática duplicada.
       */
      throw new Error(
        `Alegra credit note ${creditNoteId} was created, but could not be saved in booking ${booking.booking_code}: ${saveCreditNoteError.message}`
      );
    }

    console.log(
      "ALEGRA CREDIT NOTE ISSUED:",
      {
        bookingId:
          booking.id,

        bookingCode:
          booking.booking_code,

        invoiceId:
          booking.invoice_id,

        creditNoteId,
        creditNoteNumber,
        refundAmount,
      }
    );

    return {
      ok: true,
      alreadyIssued: false,

      bookingId:
        booking.id,

      bookingCode:
        booking.booking_code,

      invoiceId:
        booking.invoice_id,

      creditNoteId,
      creditNoteNumber,
      refundAmount,
    };
  } catch (error) {
    /*
     * Só marcamos erro quando ainda
     * não conseguimos gravar um
     * credit_note_id.
     */
    const currentBooking =
      await loadBooking(
        booking.id
      ).catch(() => null);

    if (
      !currentBooking?.credit_note_id
    ) {
      await saveCreditNoteError(
        booking.id,
        error
      );
    }

    throw error;
  }
}