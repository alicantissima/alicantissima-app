


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeLanguage } from "@/lib/i18n";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.alicantissima.es";

const privateFeedbackUrl = "https://wa.me/34624278808";

function getReviewSendAt(checkOutTime?: string | null) {
  if (!checkOutTime) return null;

  const checkout = new Date(checkOutTime);
  if (Number.isNaN(checkout.getTime())) return null;

  const sendAt = new Date(checkout);
  sendAt.setHours(sendAt.getHours() + 24);

  return sendAt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.BOOKING_FROM_EMAIL || "Alicantissima <bookings@alicantissima.es>";

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
    cache: "no-store",
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Resend error: ${response.status} ${JSON.stringify(json)}`
    );
  }

  if (!json?.id) {
    throw new Error(`Resend success without id: ${JSON.stringify(json)}`);
  }

  return json;
}

function buildReviewEmailText(params: {
  reviewUrl: string;
  language?: string | null;
}) {
  const language = normalizeLanguage(params.language);

  const titleByLanguage: Record<string, string> = {
    es: "¿Cómo fue tu experiencia con Alicantissima?",
    en: "How was your experience with Alicantissima?",
    fr: "Comment s’est passée votre expérience avec Alicantissima ?",
    it: "Com’è stata la tua esperienza con Alicantissima?",
    no: "Hvordan var opplevelsen din med Alicantissima?",
    de: "Wie war deine Erfahrung mit Alicantissima?",
    pl: "Jakie były Twoje wrażenia z Alicantissima?",
    sv: "Hur var din upplevelse med Alicantissima?",
    fi: "Millainen kokemuksesi Alicantissiman kanssa oli?",
    da: "Hvordan var din oplevelse med Alicantissima?",
    hu: "Milyen volt az élményed az Alicantissimával?",
    pt: "Como foi a tua experiência com a Alicantissima?",
  };

  const subtitleByLanguage: Record<string, string> = {
    es: "Tu opinión ayuda a otros viajeros a saber qué pueden esperar.",
    en: "Your feedback helps other travelers know what to expect.",
    fr: "Votre avis aide d’autres voyageurs à savoir à quoi s’attendre.",
    it: "Il tuo feedback aiuta altri viaggiatori a sapere cosa aspettarsi.",
    no: "Tilbakemeldingen din hjelper andre reisende å vite hva de kan forvente.",
    de: "Dein Feedback hilft anderen Reisenden zu verstehen, was sie erwartet.",
    pl: "Twoja opinia pomaga innym podróżnym wiedzieć, czego mogą się spodziewać.",
    sv: "Din feedback hjälper andra resenärer att veta vad de kan förvänta sig.",
    fi: "Palautteesi auttaa muita matkailijoita tietämään, mitä odottaa.",
    da: "Din feedback hjælper andre rejsende med at vide, hvad de kan forvente.",
    hu: "A visszajelzésed segít más utazóknak tudni, mire számíthatnak.",
    pt: "O teu feedback ajuda outros viajantes a perceber melhor o que podem esperar.",
  };

  const goodByLanguage: Record<string, string> = {
    es: "⭐ Genial — dejar una reseña en Google",
    en: "⭐ Great — leave a Google review",
    fr: "⭐ Super — laisser un avis Google",
    it: "⭐ Ottimo — lascia una recensione su Google",
    no: "⭐ Flott — legg igjen en Google-anmeldelse",
    de: "⭐ Super — Google-Bewertung hinterlassen",
    pl: "⭐ Świetnie — zostaw opinię w Google",
    sv: "⭐ Toppen — lämna en Google-recension",
    fi: "⭐ Hienoa — jätä Google-arvostelu",
    da: "⭐ Super — skriv en Google-anmeldelse",
    hu: "⭐ Nagyszerű — írj Google-értékelést",
    pt: "⭐ Excelente — deixar uma review no Google",
  };

  const improveByLanguage: Record<string, string> = {
    es: "😐 Podría ser mejor — dinos cómo mejorar",
    en: "😐 Could be better — tell us how to improve",
    fr: "😐 Cela pourrait être mieux — dites-nous comment nous améliorer",
    it: "😐 Potrebbe andare meglio — dicci come migliorare",
    no: "😐 Kunne vært bedre — fortell oss hvordan vi kan forbedre oss",
    de: "😐 Könnte besser sein — sag uns, wie wir uns verbessern können",
    pl: "😐 Mogło być lepiej — powiedz nam, jak możemy się poprawić",
    sv: "😐 Det kunde vara bättre — berätta hur vi kan förbättra oss",
    fi: "😐 Voisi olla parempi — kerro miten voimme parantaa",
    da: "😐 Det kunne være bedre — fortæl os hvordan vi kan forbedre os",
    hu: "😐 Lehetne jobb — mondd el, hogyan javíthatunk",
    pt: "😐 Poderia ser melhor — diz-nos como melhorar",
  };

  return [
    titleByLanguage[language] || titleByLanguage.en,
    "",
    subtitleByLanguage[language] || subtitleByLanguage.en,
    "",
    `${goodByLanguage[language] || goodByLanguage.en}: ${params.reviewUrl}`,
    `${improveByLanguage[language] || improveByLanguage.en}: ${privateFeedbackUrl}`,
    "",
    "Alicantissima | Luggage Storage & Shower Lounge",
  ].join("\n");
}

function buildReviewEmailHtml(params: {
  reviewUrl: string;
  language?: string | null;
}) {
  const language = normalizeLanguage(params.language);

  const titleByLanguage: Record<string, string> = {
    es: "¿Cómo fue tu experiencia con Alicantissima?",
    en: "How was your experience with Alicantissima?",
    fr: "Comment s’est passée votre expérience avec Alicantissima ?",
    it: "Com’è stata la tua esperienza con Alicantissima?",
    no: "Hvordan var opplevelsen din med Alicantissima?",
    de: "Wie war deine Erfahrung mit Alicantissima?",
    pl: "Jakie były Twoje wrażenia z Alicantissima?",
    sv: "Hur var din upplevelse med Alicantissima?",
    fi: "Millainen kokemuksesi Alicantissiman kanssa oli?",
    da: "Hvordan var din oplevelse med Alicantissima?",
    hu: "Milyen volt az élményed az Alicantissimával?",
    pt: "Como foi a tua experiência com a Alicantissima?",
  };

  const subtitleByLanguage: Record<string, string> = {
    es: "Tu opinión ayuda a otros viajeros a saber qué pueden esperar.",
    en: "Your feedback helps other travelers know what to expect.",
    fr: "Votre avis aide d’autres voyageurs à savoir à quoi s’attendre.",
    it: "Il tuo feedback aiuta altri viaggiatori a sapere cosa aspettarsi.",
    no: "Tilbakemeldingen din hjelper andre reisende å vite hva de kan forvente.",
    de: "Dein Feedback hilft anderen Reisenden zu verstehen, was sie erwartet.",
    pl: "Twoja opinia pomaga innym podróżnym wiedzieć, czego mogą się spodziewać.",
    sv: "Din feedback hjälper andra resenärer att veta vad de kan förvänta sig.",
    fi: "Palautteesi auttaa muita matkailijoita tietämään, mitä odottaa.",
    da: "Din feedback hjælper andre rejsende med at vide, hvad de kan forvente.",
    hu: "A visszajelzésed segít más utazóknak tudni, mire számíthatnak.",
    pt: "O teu feedback ajuda outros viajantes a perceber melhor o que podem esperar.",
  };

  const goodByLanguage: Record<string, string> = {
    es: "⭐ Genial — dejar una reseña en Google",
    en: "⭐ Great — leave a Google review",
    fr: "⭐ Super — laisser un avis Google",
    it: "⭐ Ottimo — lascia una recensione su Google",
    no: "⭐ Flott — legg igjen en Google-anmeldelse",
    de: "⭐ Super — Google-Bewertung hinterlassen",
    pl: "⭐ Świetnie — zostaw opinię w Google",
    sv: "⭐ Toppen — lämna en Google-recension",
    fi: "⭐ Hienoa — jätä Google-arvostelu",
    da: "⭐ Super — skriv en Google-anmeldelse",
    hu: "⭐ Nagyszerű — írj Google-értékelést",
    pt: "⭐ Excelente — deixar uma review no Google",
  };

  const improveByLanguage: Record<string, string> = {
    es: "😐 Podría ser mejor — dinos cómo mejorar",
    en: "😐 Could be better — tell us how to improve",
    fr: "😐 Cela pourrait être mieux — dites-nous comment nous améliorer",
    it: "😐 Potrebbe andare meglio — dicci come migliorare",
    no: "😐 Kunne vært bedre — fortell oss hvordan vi kan forbedre oss",
    de: "😐 Könnte besser sein — sag uns, wie wir uns verbessern können",
    pl: "😐 Mogło być lepiej — powiedz nam, jak możemy się poprawić",
    sv: "😐 Det kunde vara bättre — berätta hur vi kan förbättra oss",
    fi: "😐 Voisi olla parempi — kerro miten voimme parantaa",
    da: "😐 Det kunne være bedre — fortæl os hvordan vi kan forbedre os",
    hu: "😐 Lehetne jobb — mondd el, hogyan javíthatunk",
    pt: "😐 Poderia ser melhor — diz-nos como melhorar",
  };

  return `
    <div style="margin:0; padding:0; background:#f5f5f5;">
      <div style="max-width:760px; margin:0 auto; padding:40px 16px; font-family:Arial,Helvetica,sans-serif;">
        <div style="background:#ffffff; border-radius:28px; padding:48px 28px; text-align:center;">
          <h1 style="margin:0 0 18px 0; font-size:34px; line-height:42px; color:#111111; font-weight:700;">
            ${titleByLanguage[language] || titleByLanguage.en}
          </h1>

          <p style="margin:0 0 34px 0; font-size:16px; line-height:26px; color:#5b6470;">
            ${subtitleByLanguage[language] || subtitleByLanguage.en}
          </p>

          <div style="margin:0 auto; max-width:620px;">
            <a
              href="${params.reviewUrl}"
              target="_blank"
              rel="noreferrer"
              style="display:block; width:100%; box-sizing:border-box; background:#000000; color:#ffffff; text-decoration:none; font-size:18px; line-height:24px; font-weight:700; padding:20px 24px; border-radius:18px; margin-bottom:18px;"
            >
              ${goodByLanguage[language] || goodByLanguage.en}
            </a>

            <a
              href="${privateFeedbackUrl}"
              target="_blank"
              rel="noreferrer"
              style="display:block; width:100%; box-sizing:border-box; background:#ffffff; color:#111111; text-decoration:none; font-size:18px; line-height:24px; font-weight:700; padding:20px 24px; border-radius:18px; border:1px solid #cfcfcf;"
            >
              ${improveByLanguage[language] || improveByLanguage.en}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildTrackedReviewUrl(params: {
  bookingCode: string;
  language?: string | null;
}) {
  const url = new URL("/review", appUrl);
  url.searchParams.set("source", "email");
  url.searchParams.set("booking", params.bookingCode);

  if (params.language) {
    url.searchParams.set("lang", normalizeLanguage(params.language));
  }

  return url.toString();
}

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const manualSecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  const isManualAuthorized =
    !!cronSecret && !!manualSecret && manualSecret === cronSecret;

  if (!isVercelCron && !isManualAuthorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      customer_name,
      customer_email,
      language,
      status,
      check_out_time,
      review_email_sent_at
    `)
    .in("status", ["finished", "completed"])
    .not("check_out_time", "is", null)
    .is("review_email_sent_at", null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

    let sent = 0;
  let skipped = 0;
  let skippedNoEmail = 0;
  let skippedInvalidEmail = 0;
  let skippedNotDueYet = 0;
  let skippedMaxLimit = 0;

  const errors: Array<{ booking_code: string; error: string }> = [];
  const debug: Array<Record<string, unknown>> = [];
  const MAX_SENDS_PER_RUN = 50;

  for (const booking of bookings || []) {
    if (sent >= MAX_SENDS_PER_RUN) {
      skipped += 1;
      skippedMaxLimit += 1;
      debug.push({
        booking_code: booking.booking_code,
        action: "skip",
        reason: "max_limit_reached",
      });
      continue;
    }

    const email = booking.customer_email?.trim();

    if (!email) {
      skipped += 1;
      skippedNoEmail += 1;
      debug.push({
        booking_code: booking.booking_code,
        action: "skip",
        reason: "missing_email",
      });
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped += 1;
      skippedInvalidEmail += 1;
      debug.push({
        booking_code: booking.booking_code,
        action: "skip",
        reason: "invalid_email",
        email,
      });
      continue;
    }

    const sendAt = getReviewSendAt(booking.check_out_time);

    if (!sendAt || now < sendAt) {
      skipped += 1;
      skippedNotDueYet += 1;
      debug.push({
        booking_code: booking.booking_code,
        action: "skip",
        reason: "not_due_yet",
        check_out_time: booking.check_out_time,
        send_at: sendAt ? sendAt.toISOString() : null,
        now: now.toISOString(),
      });
      continue;
    }

    const language = normalizeLanguage(booking.language);

    const subjectByLanguage: Record<string, string> = {
      es: "¿Cómo fue tu experiencia con Alicantissima?",
      en: "How was your experience with Alicantissima?",
      fr: "Comment s’est passée votre expérience avec Alicantissima ?",
      it: "Com’è stata la tua esperienza con Alicantissima?",
      no: "Hvordan var opplevelsen din med Alicantissima?",
      de: "Wie war deine Erfahrung mit Alicantissima?",
      pl: "Jakie były Twoje wrażenia z Alicantissima?",
      sv: "Hur var din upplevelse med Alicantissima?",
      fi: "Millainen kokemuksesi Alicantissiman kanssa oli?",
      da: "Hvordan var din oplevelse med Alicantissima?",
      hu: "Milyen volt az élményed az Alicantissimával?",
      pt: "Como foi a tua experiência com a Alicantissima?",
    };

    try {
      const trackedReviewUrl = buildTrackedReviewUrl({
        bookingCode: booking.booking_code,
        language: booking.language,
      });

      const resendResult = await sendEmail({
        to: email,
        subject: subjectByLanguage[language] || subjectByLanguage.en,
        text: buildReviewEmailText({
          reviewUrl: trackedReviewUrl,
          language,
        }),
        html: buildReviewEmailHtml({
          reviewUrl: trackedReviewUrl,
          language,
        }),
      });

      const sentAtIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          review_email_sent_at: sentAtIso,
        })
        .eq("id", booking.id);

      if (updateError) {
        errors.push({
          booking_code: booking.booking_code,
          error: updateError.message,
        });

        debug.push({
          booking_code: booking.booking_code,
          action: "send_ok_update_failed",
          email,
          resend_id: resendResult.id,
          update_error: updateError.message,
        });
      } else {
        sent += 1;

        debug.push({
          booking_code: booking.booking_code,
          action: "sent",
          email,
          resend_id: resendResult.id,
          review_email_sent_at: sentAtIso,
        });

        console.log("[review-email] sent", {
          booking_code: booking.booking_code,
          email,
          resend_id: resendResult.id,
          review_email_sent_at: sentAtIso,
        });
      }

      await sleep(600);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      errors.push({
        booking_code: booking.booking_code,
        error: message,
      });

      debug.push({
        booking_code: booking.booking_code,
        action: "error",
        email,
        error: message,
      });

      console.error("[review-email] failed", {
        booking_code: booking.booking_code,
        email,
        error: message,
      });

      await sleep(600);
    }
  }

    return NextResponse.json({
    ok: true,
    now: now.toISOString(),
    found: bookings?.length || 0,
    sent,
    skipped,
    skippedNoEmail,
    skippedInvalidEmail,
    skippedNotDueYet,
    skippedMaxLimit,
    errors,
    debug,
  });
}