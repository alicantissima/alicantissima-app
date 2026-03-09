


"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "A criar..." : "Criar reserva"}
    </button>
  );
}

export default function NewBookingForm({ action }: Props) {
  const [bags, setBags] = useState(0);
  const [showers, setShowers] = useState(0);
  const [combos, setCombos] = useState(0);

  const total = useMemo(() => {
    return bags * 8 + showers * 12 + combos * 18;
  }, [bags, showers, combos]);

  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(total);
  }, [total]);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Nome</label>
          <input
            name="name"
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="Cliente"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="text-sm font-medium">City</label>
          <input
            name="city"
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="Ex: Coimbra"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Checkout Time</label>
          <input
            name="checkout_time"
            className="mt-1 w-full rounded-xl border p-3"
            placeholder="Ex: 17:30"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">
            Luggage <span className="text-gray-500">(8 €)</span>
          </label>
          <input
            name="bags"
            type="number"
            min={0}
            value={bags}
            onChange={(e) => setBags(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Shower <span className="text-gray-500">(12 €)</span>
          </label>
          <input
            name="showers"
            type="number"
            min={0}
            value={showers}
            onChange={(e) => setShowers(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Luggage + Shower <span className="text-gray-500">(18 €)</span>
          </label>
          <input
            name="combos"
            type="number"
            min={0}
            value={combos}
            onChange={(e) => setCombos(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-xl border p-4 text-lg font-semibold">
        Total: {formattedTotal}
      </div>

      <SubmitButton />
    </form>
  );
}