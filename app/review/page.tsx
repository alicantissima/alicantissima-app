"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReviewPage() {
  const searchParams = useSearchParams();

  const source = searchParams.get("source");
  const booking = searchParams.get("booking");
  const lang = searchParams.get("lang");

  const googleReviewUrl =
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    "https://g.page/r/YOUR_GOOGLE_REVIEW_ID/review";

  useEffect(() => {
    console.log("REVIEW PAGE OPENED", {
      source,
      booking,
      lang,
    });

    // mais à frente, aqui podes gravar no Supabase
    // fetch("/api/review-track", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     event: "opened",
    //     source,
    //     booking,
    //     lang,
    //   }),
    // });
  }, [source, booking, lang]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">
        How was your experience with Alicantissima? TEST
      </h1>

      <p className="mb-10 text-gray-600">
        Your feedback helps other travelers know what to expect.
      </p>

      <div className="flex flex-col gap-4">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-black py-4 text-lg font-semibold text-white hover:opacity-90"
        >
          ⭐ Great — leave a Google review
        </a>

        <Link
          href="/contact"
          className="rounded-xl border py-4 text-lg font-semibold hover:bg-gray-50"
        >
          😐 Could be better — tell us privately
        </Link>
      </div>
    </main>
  );
}