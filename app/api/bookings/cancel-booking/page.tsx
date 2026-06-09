


import CancelBookingClient from "./CancelBookingClient";

type CancelBookingSearchParams = Promise<{
  code?: string;
  token?: string;
}>;

export const dynamic = "force-dynamic";

export default async function CancelBookingPage({
  searchParams,
}: {
  searchParams: CancelBookingSearchParams;
}) {
  const params = await searchParams;

  const code = params.code?.trim() || "";
  const token = params.token?.trim() || "";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12 text-center text-zinc-900 dark:text-white">
      <section className="w-full rounded-[28px] border border-zinc-300 bg-white p-6 text-zinc-900 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Alicantissima
        </p>

        <h1 className="text-2xl font-bold text-zinc-900">
          Cancel booking
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          You can cancel this booking for free up to 24 hours before your booking time.
          If eligible, your online payment will be refunded automatically.
        </p>

        {code ? (
          <p className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Booking code:{" "}
            <strong className="text-zinc-900">{code}</strong>
          </p>
        ) : null}

        <CancelBookingClient code={code} token={token} />
      </section>

      <p className="mt-8 text-sm text-zinc-500">
        Alicantissima | Luggage Storage & Shower Lounge
      </p>
    </main>
  );
}