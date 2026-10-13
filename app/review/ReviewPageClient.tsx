


"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReviewPageClient() {
  const searchParams = useSearchParams();

  const source = searchParams.get("source");
  const booking = searchParams.get("booking");
  const lang = searchParams.get("lang");

  const reviewUrl = "https://www.tripadvisor.com/UserReviewEdit-g1064230-d33074627-Alicantissima_Luggage_Storage_Shower_Lounge-Alicante_Costa_Blanca_Province_of_Alicante_Val.html";

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
        How was your experience with Alicantissima?
      </h1>

      <p className="mb-10 text-gray-600">
        Your feedback helps other travelers know what to expect.
      </p>

      <div className="flex flex-col gap-4">
  <a
    href={reviewUrl}
    target="_blank"
    rel="noreferrer"
    className="rounded-xl bg-black py-4 text-lg font-semibold text-white hover:opacity-90"
  >
    ⭐ Leave a review on Tripadvisor
  </a>

  <a
    href={`https://wa.me/34624278808?text=${encodeURIComponent(
      `Hello Alicantissima. I would like to share some private feedback.${
        booking ? ` Booking: ${booking}.` : ""
      }`
    )}`}
    target="_blank"
    rel="noreferrer"
    className="rounded-xl border py-4 text-lg font-semibold hover:bg-gray-50"
  >
    😐 Could be better — tell us how to improve
  </a>
</div>
    </main>
  );
}