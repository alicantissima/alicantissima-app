


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGmailClient, getGmailUserId } from "@/lib/gmail";
import { extractMessageText } from "@/lib/gmailMessageText";
import { parseBokunEmail } from "@/lib/parseBokunEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getSecretFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return (
    req.headers.get("x-cron-secret") ||
    req.nextUrl.searchParams.get("secret") ||
    ""
  );
}

export async function GET(req: NextRequest) {
  try {
    const providedSecret = getSecretFromRequest(req);
    if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gmail = getGmailClient();
    const userId = getGmailUserId();
    const supabase = createAdminClient();

    const query = `from:no-reply@bokun.io subject:"New booking:" newer_than:7d`;

    const listRes = await gmail.users.messages.list({
      userId,
      q: query,
      maxResults: 25,
    });

    const messages = listRes.data.messages || [];

    let scanned = 0;
    let created = 0;
    let skipped = 0;
    const errors: Array<{ id?: string; reason: string }> = [];

    for (const msg of messages) {
      scanned += 1;

      try {
        if (!msg.id) {
          skipped += 1;
          continue;
        }

        const full = await gmail.users.messages.get({
          userId,
          id: msg.id,
          format: "full",
        });

        const rawText = extractMessageText(full.data);
        if (!rawText) {
          skipped += 1;
          continue;
        }

        const parsed = parseBokunEmail(rawText);

        if (!parsed.bookingCode) {
          skipped += 1;
          errors.push({ id: msg.id, reason: "Missing booking code" });
          continue;
        }

        const { data: existing, error: existingError } = await supabase
          .from("bookings")
          .select("id")
          .eq("booking_code", parsed.bookingCode)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing) {
          skipped += 1;
          continue;
        }

        const bookingInsert: Record<string, unknown> = {
          booking_code: parsed.bookingCode,
          customer_name: parsed.customerName || "Viator Customer",
          customer_email: parsed.email,
          total_amount: parsed.viatorAmount ?? 0,
          currency: "EUR",
          status: "booked",
          source: "viator",
          payment_method: "viator",
          service_date: parsed.serviceDate,
          language: "en",
          notes: "Imported automatically from Bokun/Gmail",
        };

        const { data: bookingRow, error: bookingError } = await supabase
          .from("bookings")
          .insert(bookingInsert)
          .select("id")
          .single();

        if (bookingError) throw bookingError;

        const itemMeta = {
          date: parsed.serviceDate,
          source: "viator",
          extRef: parsed.extRef,
          bookingRef: parsed.bookingRef,
          productBookingRef: parsed.productBookingRef,
          pax: parsed.paxRaw,
          importedFrom: "bokun_gmail",
        };

        const { error: itemError } = await supabase.from("booking_items").insert({
          booking_id: bookingRow.id,
          title: parsed.product || "Viator booking",
          quantity: parsed.quantity ?? 1,
          line_total: parsed.viatorAmount ?? 0,
          product_type: "luggage",
          meta: itemMeta,
        });

        if (itemError) throw itemError;

        created += 1;
            } catch (error) {
        const messageId = msg.id ?? undefined;

        errors.push({
          id: messageId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }

    return NextResponse.json({
      ok: true,
      scanned,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}