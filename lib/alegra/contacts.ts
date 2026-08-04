


import { alegraRequest } from "@/lib/alegra/client";

import type {
  AlegraContact,
  CreateAlegraContactInput,
} from "@/lib/alegra/types";

type CreateContactParams = {
  name: string | null;
  email: string | null;
  phone: string | null;
  bookingCode: string;
};

function cleanText(value: string | null | undefined) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function normalizeEmail(value: string | null | undefined) {
  const email = cleanText(value)?.toLowerCase() ?? null;

  if (!email) {
    return null;
  }

  if (!email.includes("@") || !email.includes(".")) {
    return null;
  }

  return email;
}

function buildContactName(
  name: string | null,
  email: string | null
) {
  const normalizedName = cleanText(name);

  if (normalizedName) {
    return normalizedName;
  }

  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail) {
    return normalizedEmail;
  }

  return "Cliente Alicantíssima";
}

function buildIdentificationNumber(
  bookingCode: string
) {
  const normalizedBookingCode = cleanText(bookingCode);

  if (!normalizedBookingCode) {
    throw new Error(
      "Booking code is required to create the Alegra contact."
    );
  }

  return normalizedBookingCode;
}

export async function createAlegraContact({
  name,
  email,
  phone,
  bookingCode,
}: CreateContactParams): Promise<AlegraContact> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = cleanText(phone);

  const identificationNumber =
  buildIdentificationNumber(bookingCode);

  const payload: CreateAlegraContactInput = {
  name: buildContactName(name, normalizedEmail),

  identification: identificationNumber,
identificationType: "DPO",

  type: ["client"],
  status: "active",
};

  if (normalizedEmail) {
    payload.email = normalizedEmail;
  }

  if (normalizedPhone) {
    payload.phonePrimary = normalizedPhone;
  }

  console.log(
  "ALEGRA CONTACT PAYLOAD:",
  JSON.stringify(payload, null, 2)
);

const contact = await alegraRequest<AlegraContact>(
  "/contacts",
  {
    method: "POST",
    body: JSON.stringify(payload),
  }
);

  if (!contact?.id) {
    throw new Error(
      `Alegra created a contact without returning an id: ${JSON.stringify(
        contact
      )}`
    );
  }

  console.log("ALEGRA CONTACT CREATED:", {
    contactId: String(contact.id),
    name: contact.name,
    email: normalizedEmail,
    identificationType: "DPO",
    identificationNumber,
  });

  return contact;
}