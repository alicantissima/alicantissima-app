


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
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const manualSecret = request.nextUrl.searchParams.get("secret");

  const isVercelCronAuthorized =
    !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  const isManualAuthorized =
    !!cronSecret && !!manualSecret && manualSecret === cronSecret;

  console.log("=== SEND REVIEW EMAILS CRON START ===");
  console.log("Time:", new Date().toISOString());
  console.log("authorization:", authHeader ? "present" : "missing");
  console.log("user-agent:", request.headers.get("user-agent"));
  console.log("isVercelCronAuthorized:", isVercelCronAuthorized);
  console.log("hasManualSecret:", !!manualSecret);
  console.log("isManualAuthorized:", isManualAuthorized);

  if (!isVercelCronAuthorized && !isManualAuthorized) {
    console.log("Unauthorized request blocked.");
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
    console.error("Supabase query error:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  console.log("Eligible raw bookings found:", bookings?.length || 0);

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ booking_code: string; error: string }> = [];
  const MAX_SENDS_PER_RUN = 50;

  for (const booking of bookings || []) {
    if (sent >= MAX_SENDS_PER_RUN) {
      console.log(`Skipping ${booking.booking_code}: max sends per run reached`);
      skipped += 1;
      continue;
    }

    const email = booking.customer_email?.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log(`Skipping ${booking.booking_code}: invalid email`);
      skipped += 1;
      continue;
    }

    const sendAt = getReviewSendAt(booking.check_out_time);

    if (!sendAt) {
      console.log(`Skipping ${booking.booking_code}: invalid check_out_time`);
      skipped += 1;
      continue;
    }

    if (now < sendAt) {
      console.log(
        `Skipping ${booking.booking_code}: not yet time. sendAt=${sendAt.toISOString()} now=${now.toISOString()}`
      );
      skipped += 1;
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

      console.log(`Sending review email to ${booking.booking_code} -> ${email}`);

      await sendEmail({
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

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          review_email_sent_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error(
          `Sent BUT failed to update booking ${booking.booking_code}:`,
          updateError.message
        );
        errors.push({
          booking_code: booking.booking_code,
          error: updateError.message,
        });
      } else {
        console.log(`Sent successfully: ${booking.booking_code}`);
        sent += 1;
      }

      await sleep(600);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed sending ${booking.booking_code}:`, message);

      errors.push({
        booking_code: booking.booking_code,
        error: message,
      });

      await sleep(600);
    }
  }

  console.log("=== SEND REVIEW EMAILS CRON END ===");
  console.log({
    sent,
    skipped,
    errorsCount: errors.length,
  });

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    errors,
  });
}