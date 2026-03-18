


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeLanguage } from "@/lib/i18n";

function getReviewSendAt(checkOutTime?: string | null) {
  if (!checkOutTime) return null;

  const checkout = new Date(checkOutTime);
  if (Number.isNaN(checkout.getTime())) return null;

  const sendAt = new Date(checkout);
  sendAt.setDate(sendAt.getDate() + 1);
  sendAt.setHours(21, 0, 0, 0);

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

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status} ${responseText}`);
  }
}

function buildReviewEmailText(params: {
  reviewUrl: string;
  language?: string | null;
}) {
  const language = normalizeLanguage(params.language);

  const introByLanguage: Record<string, string> = {
    es: "Esperamos que el viaje de vuelta a casa, o tu primer día en Alicante, haya ido bien.",
    en: "We hope your journey back home, or your first day in Alicante, has gone well.",
    fr: "Nous espérons que votre retour à la maison, ou votre première journée à Alicante, s’est bien passé.",
    it: "Speriamo che il tuo viaggio di ritorno a casa, o il tuo primo giorno ad Alicante, sia andato bene.",
    no: "Vi håper at reisen hjem, eller din første dag i Alicante, har gått fint.",
    de: "Wir hoffen, dass deine Heimreise oder dein erster Tag in Alicante gut verlaufen ist.",
    pl: "Mamy nadzieję, że podróż do domu lub Twój pierwszy dzień w Alicante minęły dobrze.",
    sv: "Vi hoppas att din resa hem, eller din första dag i Alicante, har gått bra.",
    fi: "Toivomme, että matkasi kotiin tai ensimmäinen päiväsi Alicantessa on sujunut hyvin.",
    da: "Vi håber, at din rejse hjem eller din første dag i Alicante er gået godt.",
    hu: "Reméljük, hogy a hazautad vagy az első napod Alicantéban jól telt.",
    pt: "Esperamos que a viagem de regresso a casa, ou o teu primeiro dia em Alicante, tenha corrido bem.",
  };

  const bodyByLanguage: Record<string, string> = {
    es: "Fue un placer recibirte en Alicantissima | Luggage Storage & Shower Lounge. Gracias por elegirnos.",
    en: "It was a pleasure to welcome you at Alicantissima | Luggage Storage & Shower Lounge. Thank you for choosing us.",
    fr: "Ce fut un plaisir de vous accueillir à Alicantissima | Luggage Storage & Shower Lounge. Merci de nous avoir choisis.",
    it: "È stato un piacere accoglierti da Alicantissima | Luggage Storage & Shower Lounge. Grazie per averci scelto.",
    no: "Det var en glede å ønske deg velkommen til Alicantissima | Luggage Storage & Shower Lounge. Takk for at du valgte oss.",
    de: "Es war uns eine Freude, dich bei Alicantissima | Luggage Storage & Shower Lounge begrüßen zu dürfen. Danke, dass du uns gewählt hast.",
    pl: "Miło było gościć Cię w Alicantissima | Luggage Storage & Shower Lounge. Dziękujemy za wybór naszej usługi.",
    sv: "Det var ett nöje att få välkomna dig till Alicantissima | Luggage Storage & Shower Lounge. Tack för att du valde oss.",
    fi: "Meillä oli ilo toivottaa sinut tervetulleeksi Alicantissima | Luggage Storage & Shower Loungeen. Kiitos, että valitsit meidät.",
    da: "Det var en fornøjelse at byde dig velkommen hos Alicantissima | Luggage Storage & Shower Lounge. Tak fordi du valgte os.",
    hu: "Öröm volt üdvözölni téged az Alicantissima | Luggage Storage & Shower Lounge-ban. Köszönjük, hogy minket választottál.",
    pt: "Para nós foi um prazer receber-te na Alicantissima | Luggage Storage & Shower Lounge. Obrigado por nos teres escolhido.",
  };

  const askByLanguage: Record<string, string> = {
    es: "Si tu experiencia fue positiva, tu reseña en Google Maps ayuda mucho a otros viajeros a saber qué pueden esperar de nuestros servicios.",
    en: "If your experience was positive, your Google Maps review helps other travelers understand what they can expect from our services.",
    fr: "Si votre expérience a été positive, votre avis sur Google Maps aide beaucoup d’autres voyageurs à savoir à quoi s’attendre de nos services.",
    it: "Se la tua esperienza è stata positiva, la tua recensione su Google Maps aiuta molto altri viaggiatori a capire cosa possono aspettarsi dai nostri servizi.",
    no: "Hvis opplevelsen din var positiv, hjelper anmeldelsen din på Google Maps andre reisende med å forstå hva de kan forvente av tjenestene våre.",
    de: "Wenn deine Erfahrung positiv war, hilft deine Google-Maps-Bewertung anderen Reisenden sehr dabei zu verstehen, was sie von unseren Dienstleistungen erwarten können.",
    pl: "Jeśli Twoje doświadczenie było pozytywne, Twoja opinia w Google Maps bardzo pomaga innym podróżnym zrozumieć, czego mogą oczekiwać od naszych usług.",
    sv: "Om din upplevelse var positiv hjälper din recension på Google Maps andra resenärer att förstå vad de kan förvänta sig av våra tjänster.",
    fi: "Jos kokemuksesi oli positiivinen, Google Maps -arvostelusi auttaa muita matkailijoita ymmärtämään, mitä he voivat odottaa palveluiltamme.",
    da: "Hvis din oplevelse var positiv, hjælper din anmeldelse på Google Maps andre rejsende med at forstå, hvad de kan forvente af vores tjenester.",
    hu: "Ha pozitív volt az élményed, a Google Maps értékelésed sokat segít más utazóknak abban, hogy tudják, mire számíthatnak a szolgáltatásainktól.",
    pt: "Se a tua experiência foi positiva, a tua review no Google Maps ajuda muito outros viajantes a perceber melhor o que podem esperar dos nossos serviços.",
  };

  const thanksByLanguage: Record<string, string> = {
    es: "Muchas gracias.",
    en: "Thank you very much.",
    fr: "Merci beaucoup.",
    it: "Grazie mille.",
    no: "Tusen takk.",
    de: "Vielen Dank.",
    pl: "Bardzo dziękujemy.",
    sv: "Stort tack.",
    fi: "Paljon kiitoksia.",
    da: "Mange tak.",
    hu: "Nagyon köszönjük.",
    pt: "Muito obrigado.",
  };

  const ctaByLanguage: Record<string, string> = {
    es: "Dejar reseña en Google Maps",
    en: "Leave a review on Google Maps",
    fr: "Laisser un avis sur Google Maps",
    it: "Lascia una recensione su Google Maps",
    no: "Legg igjen en anmeldelse på Google Maps",
    de: "Bewertung auf Google Maps abgeben",
    pl: "Zostaw opinię w Google Maps",
    sv: "Lämna en recension på Google Maps",
    fi: "Jätä arvostelu Google Mapsiin",
    da: "Skriv en anmeldelse på Google Maps",
    hu: "Értékelés írása a Google Mapsen",
    pt: "Deixar review no Google Maps",
  };

  return [
    introByLanguage[language] || introByLanguage.en,
    "",
    bodyByLanguage[language] || bodyByLanguage.en,
    "",
    askByLanguage[language] || askByLanguage.en,
    "",
    `${ctaByLanguage[language] || ctaByLanguage.en}: ${params.reviewUrl}`,
    "",
    thanksByLanguage[language] || thanksByLanguage.en,
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

  const introByLanguage: Record<string, string> = {
    es: "Esperamos que el viaje de vuelta a casa, o tu primer día en Alicante, haya ido bien.",
    en: "We hope your journey back home, or your first day in Alicante, has gone well.",
    fr: "Nous espérons que votre retour à la maison, ou votre première journée à Alicante, s’est bien passé.",
    it: "Speriamo che il tuo viaggio di ritorno a casa, o il tuo primo giorno ad Alicante, sia andato bene.",
    no: "Vi håper at reisen hjem, eller din første dag i Alicante, har gått fint.",
    de: "Wir hoffen, dass deine Heimreise oder dein erster Tag in Alicante gut verlaufen ist.",
    pl: "Mamy nadzieję, że podróż do domu lub Twój pierwszy dzień w Alicante minęły dobrze.",
    sv: "Vi hoppas att din resa hem, eller din första dag i Alicante, har gått bra.",
    fi: "Toivomme, että matkasi kotiin tai ensimmäinen päiväsi Alicantessa on sujunut hyvin.",
    da: "Vi håber, at din rejse hjem eller din første dag i Alicante er gået godt.",
    hu: "Reméljük, hogy a hazautad vagy az első napod Alicantéban jól telt.",
    pt: "Esperamos que a viagem de regresso a casa, ou o teu primeiro dia em Alicante, tenha corrido bem.",
  };

  const bodyByLanguage: Record<string, string> = {
    es: "Fue un placer recibirte en Alicantissima | Luggage Storage & Shower Lounge. Gracias por elegirnos.",
    en: "It was a pleasure to welcome you at Alicantissima | Luggage Storage & Shower Lounge. Thank you for choosing us.",
    fr: "Ce fut un plaisir de vous accueillir à Alicantissima | Luggage Storage & Shower Lounge. Merci de nous avoir choisis.",
    it: "È stato un piacere accoglierti da Alicantissima | Luggage Storage & Shower Lounge. Grazie per averci scelto.",
    no: "Det var en glede å ønske deg velkommen til Alicantissima | Luggage Storage & Shower Lounge. Takk for at du valgte oss.",
    de: "Es war uns eine Freude, dich bei Alicantissima | Luggage Storage & Shower Lounge begrüßen zu dürfen. Danke, dass du uns gewählt hast.",
    pl: "Miło było gościć Cię w Alicantissima | Luggage Storage & Shower Lounge. Dziękujemy za wybór naszej usługi.",
    sv: "Det var ett nöje att få välkomna dig till Alicantissima | Luggage Storage & Shower Lounge. Tack för att du valde oss.",
    fi: "Meillä oli ilo toivottaa sinut tervetulleeksi Alicantissima | Luggage Storage & Shower Loungeen. Kiitos, että valitsit meidät.",
    da: "Det var en fornøjelse at byde dig velkommen hos Alicantissima | Luggage Storage & Shower Lounge. Tak fordi du valgte os.",
    hu: "Öröm volt üdvözölni téged az Alicantissima | Luggage Storage & Shower Lounge-ban. Köszönjük, hogy minket választottál.",
    pt: "Para nós foi um prazer receber-te na Alicantissima | Luggage Storage & Shower Lounge. Obrigado por nos teres escolhido.",
  };

  const askByLanguage: Record<string, string> = {
    es: "Si tu experiencia fue positiva, tu reseña en Google Maps ayuda mucho a otros viajeros a saber qué pueden esperar de nuestros servicios.",
    en: "If your experience was positive, your Google Maps review helps other travelers understand what they can expect from our services.",
    fr: "Si votre expérience a été positive, votre avis sur Google Maps aide beaucoup d’autres voyageurs à savoir à quoi s’attendre de nos services.",
    it: "Se la tua esperienza è stata positiva, la tua recensione su Google Maps aiuta molto altri viaggiatori a capire cosa possono aspettarsi dai nostri servizi.",
    no: "Hvis opplevelsen din var positiv, hjelper anmeldelsen din på Google Maps andre reisende med å forstå hva de kan forvente av tjenestene våre.",
    de: "Wenn deine Erfahrung positiv war, hilft deine Google-Maps-Bewertung anderen Reisenden sehr dabei zu verstehen, was sie von unseren Dienstleistungen erwarten können.",
    pl: "Jeśli Twoje doświadczenie było pozytywne, Twoja opinia w Google Maps bardzo pomaga innym podróżnym zrozumieć, czego mogą oczekiwać od naszych usług.",
    sv: "Om din upplevelse var positiv hjälper din recension på Google Maps andra resenärer att förstå vad de kan förvänta sig av våra tjänster.",
    fi: "Jos kokemuksesi oli positiivinen, Google Maps -arvostelusi auttaa muita matkailijoita ymmärtämään, mitä he voivat odottaa palveluiltamme.",
    da: "Hvis din oplevelse var positiv, hjælper din anmeldelse på Google Maps andre rejsende med at forstå, hvad de kan forvente af vores tjenester.",
    hu: "Ha pozitív volt az élményed, a Google Maps értékelésed sokat segít más utazóknak abban, hogy tudják, mire számíthatnak a szolgáltatásainktól.",
    pt: "Se a tua experiência foi positiva, a tua review no Google Maps ajuda muito outros viajantes a perceber melhor o que podem esperar dos nossos serviços.",
  };

  const thanksByLanguage: Record<string, string> = {
    es: "Muchas gracias.",
    en: "Thank you very much.",
    fr: "Merci beaucoup.",
    it: "Grazie mille.",
    no: "Tusen takk.",
    de: "Vielen Dank.",
    pl: "Bardzo dziękujemy.",
    sv: "Stort tack.",
    fi: "Paljon kiitoksia.",
    da: "Mange tak.",
    hu: "Nagyon köszönjük.",
    pt: "Muito obrigado.",
  };

  const ctaByLanguage: Record<string, string> = {
    es: "Dejar reseña en Google Maps",
    en: "Leave a review on Google Maps",
    fr: "Laisser un avis sur Google Maps",
    it: "Lascia una recensione su Google Maps",
    no: "Legg igjen en anmeldelse på Google Maps",
    de: "Bewertung auf Google Maps abgeben",
    pl: "Zostaw opinię w Google Maps",
    sv: "Lämna en recension på Google Maps",
    fi: "Jätä arvostelu Google Mapsiin",
    da: "Skriv en anmeldelse på Google Maps",
    hu: "Értékelés írása a Google Mapsen",
    pt: "Deixar review no Google Maps",
  };

  return `
    <div style="margin:0; padding:0; background:#f3f4f6;">
      <div style="max-width:640px; margin:0 auto; padding:32px 16px; font-family:Arial,Helvetica,sans-serif;">
        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:22px; padding:32px 24px; text-align:center;">
          <h1 style="margin:0 0 14px 0; font-size:24px; line-height:30px; color:#111827; font-weight:700;">
            ${titleByLanguage[language] || titleByLanguage.en}
          </h1>

          <p style="margin:0 0 12px 0; font-size:16px; line-height:24px; color:#374151;">
            ${introByLanguage[language] || introByLanguage.en}
          </p>

          <p style="margin:0 0 12px 0; font-size:16px; line-height:24px; color:#374151;">
            ${bodyByLanguage[language] || bodyByLanguage.en}
          </p>

          <p style="margin:0 0 22px 0; font-size:16px; line-height:24px; color:#374151;">
            ${askByLanguage[language] || askByLanguage.en}
          </p>

          <a
            href="${params.reviewUrl}"
            target="_blank"
            rel="noreferrer"
            style="display:inline-block; padding:12px 20px; border-radius:999px; background:#111827; color:#ffffff; text-decoration:none; font-size:15px; line-height:22px; font-weight:700;"
          >
            ${ctaByLanguage[language] || ctaByLanguage.en}
          </a>

          <p style="margin:24px 0 0 0; font-size:15px; line-height:22px; color:#374151;">
            ${thanksByLanguage[language] || thanksByLanguage.en}
          </p>

          <p style="margin:18px 0 0 0; font-size:14px; line-height:21px; color:#6b7280;">
            Alicantissima | Luggage Storage & Shower Lounge
          </p>
        </div>
      </div>
    </div>
  `;
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

  if (!reviewUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing GOOGLE_REVIEW_URL" },
      { status: 500 }
    );
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
    .eq("status", "finished")
    .not("check_out_time", "is", null)
    .is("review_email_sent_at", null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ booking_code: string; error: string }> = [];
  const MAX_SENDS_PER_RUN = 20;

  for (const booking of bookings || []) {
    if (sent >= MAX_SENDS_PER_RUN) {
      skipped += 1;
      continue;
    }

    if (!booking.customer_email?.trim()) {
      skipped += 1;
      continue;
    }

    const sendAt = getReviewSendAt(booking.check_out_time);

    if (!sendAt || now < sendAt) {
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

  await sendEmail({
    to: booking.customer_email,
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
        errors.push({
          booking_code: booking.booking_code,
          error: updateError.message,
        });
      } else {
        sent += 1;
      }

      await sleep(600);
    } catch (err) {
      errors.push({
        booking_code: booking.booking_code,
        error: err instanceof Error ? err.message : "Unknown error",
      });

      await sleep(600);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    errors,
  });
}