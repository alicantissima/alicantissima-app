


import { Suspense } from "react";
import ReviewPageClient from "./ReviewPageClient";

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-gray-600">Loading...</p>
        </main>
      }
    >
      <ReviewPageClient />
    </Suspense>
  );
}