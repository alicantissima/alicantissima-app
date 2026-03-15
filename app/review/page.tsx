


import Link from "next/link";

export default function ReviewPage() {
  const googleReviewUrl =
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    "https://g.page/r/YOUR_GOOGLE_REVIEW_ID/review";

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">
        How was your experience with Alicantissima?
      </h1>

      <p className="text-gray-600 mb-10">
        Your feedback helps other travelers know what to expect.
      </p>

      <div className="flex flex-col gap-4">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-black text-white py-4 text-lg font-semibold hover:opacity-90"
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