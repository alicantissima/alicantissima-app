


import { NextRequest, NextResponse } from "next/server";
import { alegraRequest } from "@/lib/alegra/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AlegraItem = {
  id: string | number;
  name?: string;
  reference?: string;
  description?: string;
  status?: string;
};

type AlegraTax = {
  id: string | number;
  name?: string;
  percentage?: number | string;
  rate?: number | string;
  status?: string;
};

type AlegraNumberTemplate = {
  id: string | number;
  name?: string;
  prefix?: string;
  documentType?: string;
  type?: string;
  status?: string;
};

type AlegraBankAccount = {
  id: string | number;
  name?: string;
  type?: string;
  status?: string;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    /*
     * Proteção temporária.
     *
     * Adiciona no Vercel:
     * ALEGRA_SETUP_SECRET=uma-chave-grande-e-aleatoria
     *
     * Depois abre:
     * /api/admin/alegra/setup?secret=essa-chave
     */
    const expectedSecret = process.env.ALEGRA_SETUP_SECRET;
    const receivedSecret = request.nextUrl.searchParams.get("secret");

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const [items, taxes, numberTemplates, bankAccounts] = await Promise.all([
      alegraRequest<AlegraItem[]>("/items?limit=100"),
      alegraRequest<AlegraTax[]>("/taxes?limit=100"),
      alegraRequest<AlegraNumberTemplate[]>(
        "/number-templates?limit=100"
      ),
      alegraRequest<AlegraBankAccount[]>("/bank-accounts?limit=100"),
    ]);

    const wantedReferences = new Set([
      "lugg",
      "shw",
      "lugg+shw",
    ]);

    const matchingItems = items.filter((item) =>
      wantedReferences.has(normalize(item.reference))
    );

    const matchingTaxes = taxes.filter((tax) => {
      const percentage = Number(tax.percentage ?? tax.rate);

      return percentage === 21;
    });

    const matchingNumberTemplates = numberTemplates.filter((template) => {
      const searchable = [
        template.name,
        template.prefix,
      ]
        .map(normalize)
        .join(" ");

      return searchable.includes("luswol");
    });

    const matchingBankAccounts = bankAccounts.filter((account) => {
      const searchable = normalize(account.name);

      return searchable.includes("revolut");
    });

    return NextResponse.json({
      ok: true,

      matches: {
        items: matchingItems,
        taxes: matchingTaxes,
        numberTemplates: matchingNumberTemplates,
        bankAccounts: matchingBankAccounts,
      },

      /*
       * Só para diagnóstico caso algum match não apareça.
       * Não mostramos contactos, clientes ou documentos.
       */
      available: {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          reference: item.reference,
          status: item.status,
        })),

        taxes: taxes.map((tax) => ({
          id: tax.id,
          name: tax.name,
          percentage: tax.percentage ?? tax.rate,
          status: tax.status,
        })),

        numberTemplates: numberTemplates.map((template) => ({
          id: template.id,
          name: template.name,
          prefix: template.prefix,
          documentType: template.documentType ?? template.type,
          status: template.status,
        })),

        bankAccounts: bankAccounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          status: account.status,
        })),
      },
    });
  } catch (error) {
    console.error("Alegra setup error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Alegra setup error.",
      },
      {
        status: 500,
      }
    );
  }
}