


import { alegraRequest } from "@/lib/alegra/client";
import type {
  AlegraInvoice,
  AlegraInvoiceWithPdf,
  CreateAlegraInvoiceInput,
} from "@/lib/alegra/types";

function cleanText(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function validateDate(value: string, fieldName: string) {
  const normalized = cleanText(value);

  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(
      `Invalid Alegra invoice ${fieldName}: "${String(value)}". Expected yyyy-MM-dd.`
    );
  }

  return normalized;
}

function validateInvoicePayload(payload: CreateAlegraInvoiceInput) {
  validateDate(payload.date, "date");
  validateDate(payload.dueDate, "dueDate");

  if (!payload.client?.id) {
    throw new Error("Alegra invoice client id is missing.");
  }

  if (!payload.numberTemplate?.id) {
    throw new Error("Alegra invoice number template id is missing.");
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Alegra invoice must contain at least one item.");
  }

  payload.items.forEach((item, index) => {
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!item.id) {
      throw new Error(
        `Alegra invoice item ${index + 1} is missing its item id.`
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
        `Invalid quantity in Alegra invoice item ${index + 1}: ${item.quantity}.`
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        `Invalid price in Alegra invoice item ${index + 1}: ${item.price}.`
      );
    }

    if (!Array.isArray(item.tax) || item.tax.length === 0) {
      throw new Error(
        `Alegra invoice item ${index + 1} has no tax configured.`
      );
    }

    if (!item.tax.every((tax) => Boolean(tax?.id))) {
      throw new Error(
        `Alegra invoice item ${index + 1} contains an invalid tax id.`
      );
    }
  });
}

function getInvoiceNumber(invoice: AlegraInvoice) {
  const directFullNumber = cleanText(invoice.fullNumber);

  if (directFullNumber) {
    return directFullNumber;
  }

  const templateFullNumber = cleanText(
    invoice.numberTemplate?.fullNumber
  );

  if (templateFullNumber) {
    return templateFullNumber;
  }

  const prefix = cleanText(invoice.numberTemplate?.prefix);
  const number = cleanText(
    String(
      invoice.number ??
        invoice.numberTemplate?.number ??
        ""
    )
  );

  if (prefix && number) {
    return `${prefix}${number}`;
  }

  return number;
}

export async function createAlegraInvoice(
  payload: CreateAlegraInvoiceInput
): Promise<AlegraInvoice> {
  validateInvoicePayload(payload);

  const invoice = await alegraRequest<AlegraInvoice>(
    "/invoices",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!invoice?.id) {
    throw new Error(
      `Alegra created an invoice without returning an id: ${JSON.stringify(
        invoice
      )}`
    );
  }

  console.log("ALEGRA INVOICE CREATED:", {
    invoiceId: String(invoice.id),
    invoiceNumber: getInvoiceNumber(invoice),
    total: invoice.total,
    status: invoice.status,
  });

  return invoice;
}

/**
 * Consulta novamente a fatura e pede explicitamente
 * à Alegra que inclua a URL do PDF.
 */
export async function getAlegraInvoiceWithPdf(
  invoiceId: string | number
): Promise<AlegraInvoiceWithPdf> {
  const normalizedId = cleanText(String(invoiceId));

  if (!normalizedId) {
    throw new Error("Alegra invoice id is missing.");
  }

  const invoice = await alegraRequest<AlegraInvoiceWithPdf>(
    `/invoices/${encodeURIComponent(normalizedId)}?fields=pdf`,
    {
      method: "GET",
    }
  );

  if (!invoice?.id) {
    throw new Error(
      `Alegra returned an invalid invoice for id ${normalizedId}.`
    );
  }

  return invoice;
}

export function extractAlegraInvoiceNumber(
  invoice: AlegraInvoice
) {
  return getInvoiceNumber(invoice);
}

export function extractAlegraInvoicePdfUrl(
  invoice: AlegraInvoiceWithPdf
) {
  const directPdfUrl = cleanText(invoice.pdfUrl);

  if (directPdfUrl) {
    return directPdfUrl;
  }

  return cleanText(invoice.pdf);
}