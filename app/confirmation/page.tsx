


export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md space-y-6">

        <section className="rounded-[28px] border border-white/20 p-6 text-center">
          <h1 className="text-2xl font-bold">Booking confirmed</h1>

          <p className="mt-3 text-white/60">
            See you soon at Alicantissima.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/20 p-6 text-center">
          <p className="text-sm text-white/60">Reference</p>
          <p className="text-2xl font-semibold mt-1">
            ALX-001
          </p>
        </section>

      </div>
    </main>
  );
}