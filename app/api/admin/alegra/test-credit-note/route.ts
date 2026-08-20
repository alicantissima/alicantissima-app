


import { NextRequest, NextResponse } from "next/server";
import { issueAlegraCreditNote } from "@/lib/alegra/creditNotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSecret(request: NextRequest) {
  return (
    request.headers
      .get("x-alegra-setup-secret")
      ?.trim() ?? ""
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const expectedSecret =
      process.env.ALEGRA_SETUP_SECRET?.trim();

    const receivedSecret =
      getSecret(request);

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

    const body = (await request
      .json()
      .catch(() => null)) as
      | {
          bookingId?: unknown;
          refundAmount?: unknown;
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

    const rawRefundAmount =
      body?.refundAmount;

    let refundAmount:
      | number
      | undefined = undefined;

    if (
      rawRefundAmount !== undefined &&
      rawRefundAmount !== null &&
      rawRefundAmount !== ""
    ) {
      refundAmount = Number(
        rawRefundAmount
      );

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "refundAmount must be a positive number.",
          },
          {
            status: 400,
          }
        );
      }
    }

    console.log(
      "ALEGRA MANUAL CREDIT NOTE TEST START:",
      {
        bookingId,
        refundAmount,
      }
    );

    const result =
      await issueAlegraCreditNote(
        bookingId,
        refundAmount
      );

    console.log(
      "ALEGRA MANUAL CREDIT NOTE TEST SUCCESS:",
      {
        bookingId,
        refundAmount,
        result,
      }
    );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "Alegra manual credit note test error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Alegra credit note error.",
      },
      {
        status: 500,
      }
    );
  }
}