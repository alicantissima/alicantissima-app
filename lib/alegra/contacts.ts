


import { alegraRequest } from "@/lib/alegra/client";
import type {
  AlegraContact,
  CreateAlegraContactInput,
} from "@/lib/alegra/types";

type CreateContactParams = {
  name: string | null;
  email: string | null;
  phone: string | null;
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

  /*
   * Validação simples, suficiente para evitar enviar lixo óbvio
   * para a API da Alegra.
   */
  if (!email.includes("@") || !email.includes(".")) {
    return null;
  }

  return email;
}

function buildContactName(
  name: string | null,
  email: string | null
) {
  const cleanName = cleanText(name);

  if (cleanName) {
    return cleanName;
  }

  const cleanEmail = normalizeEmail(email);

  if (cleanEmail) {
    return cleanEmail;
  }

  return "Cliente Alicantíssima";
}

export async function createAlegraContact({
  name,
  email,
  phone,
}: CreateContactParams): Promise<AlegraContact> {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = cleanText(phone);

  const payload: CreateAlegraContactInput = {
    name: buildContactName(name, normalizedEmail),
    type: ["client"],
    status: "active",
  };

  if (normalizedEmail) {
    payload.email = normalizedEmail;
  }

  if (normalizedPhone) {
    payload.phonePrimary = normalizedPhone;
  }

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
  });

  return contact;
}