


import { NextRequest, NextResponse } from "next/server";
import { issueAlegraInvoice } from "@/lib/alegra/issueInvoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSecret(request: NextRequest) {
  return request.headers.get("x-alegra-setup-secret")?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret =
      process.env.ALEGRA_SETUP_SECRET?.trim();

    const receivedSecret = getSecret(request);

    if (
      !expectedSecret ||
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
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

    const body = (await request.json().catch(() => null)) as
      | {
          bookingId?: unknown;
        }
      | null;

    const bookingId = String(
      body?.bookingId ?? ""
    ).trim();

    if (!bookingId) {
      return NextResponse.json(
        {
          ok: false,
          error: "bookingId is required.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("ALEGRA MANUAL INVOICE TEST START:", {
      bookingId,
    });

    const result =
      await issueAlegraInvoice(bookingId);

    console.log("ALEGRA MANUAL INVOICE TEST SUCCESS:", {
      bookingId,
      result,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "Alegra manual invoice test error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Alegra invoice error.",
      },
      {
        status: 500,
      }
    );
  }
}