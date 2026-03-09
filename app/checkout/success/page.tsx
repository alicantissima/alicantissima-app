


export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Booking confirmed</h1>
      <p className="text-gray-600">
        Thank you. Your booking code is <strong>{params.code ?? "—"}</strong>.
      </p>
    </main>
  );
}