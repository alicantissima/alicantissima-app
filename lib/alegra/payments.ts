


import type {
  AlegraId,
  AlegraPaymentInput,
} from "@/lib/alegra/types";

type BuildAlegraPaymentParams = {
  date: string;
  amount: number;
  bankAccountId: AlegraId;
  bookingCode: string;
  paymentReference?: string | null;
};

function validateDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      `Invalid Alegra payment date: "${value}". Expected yyyy-MM-dd.`
    );
  }

  return value;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildAlegraInvoicePayment({
  date,
  amount,
  bankAccountId,
  bookingCode,
  paymentReference,
}: BuildAlegraPaymentParams): AlegraPaymentInput {
  const normalizedAmount = roundCurrency(Number(amount));

  if (!bankAccountId) {
    throw new Error("Alegra bank account id is missing.");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error(
      `Invalid Alegra payment amount: ${String(amount)}.`
    );
  }

  const reference = String(paymentReference ?? "").trim();

  return {
    date: validateDate(date),

    account: {
      id: bankAccountId,
    },

    amount: normalizedAmount,

    paymentMethod: "credit-card",

    anotations: `Pagamento online ${bookingCode}`,

    observations: reference
      ? `Revolut order: ${reference}`
      : `Reserva ${bookingCode}`,
  };
}