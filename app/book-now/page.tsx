


"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages, normalizeLanguage } from "@/lib/i18n";

type ServiceKey = "luggage" | "shower" | "combo";

const services: {
  key: ServiceKey;
  title: string;
  subtitle: string;
  price: string;
  href: string;
}[] = [
  {
    key: "luggage",
    title: "Luggage Storage",
    subtitle: "Store your bags safely for the day.",
    price: "€8 / item",
    href: "/book-luggage",
  },
  {
    key: "shower",
    title: "Shower Service",
    subtitle: "Refresh yourself before your trip or after the beach.",
    price: "€12 / person",
    href: "/book-shower",
  },
  {
    key: "combo",
    title: "Luggage + Shower",
    subtitle: "Leave your bags, enjoy the day and take a shower.",
    price: "€18 / person",
    href: "/book-combo",
  },
];

function BookNowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const language = normalizeLanguage(searchParams.get("lang"));
  const t = getMessages(language);

  const source = searchParams.get("source") === "walkin" ? "walkin" : "";
  const selectedService = searchParams.get("service") as ServiceKey | null;

  function buildHref(service: ServiceKey) {
    const selected = services.find((item) => item.key === service);

    if (!selected) return "";

    const params = new URLSearchParams();
    params.set("lang", language);

    if (source === "walkin") {
      params.set("source", "walkin");
    }

    return `${selected.href}?${params.toString()}`;
  }

  function goToService(service: ServiceKey) {
    router.push(buildHref(service));
  }

function getWebsiteBackUrl() {
  if (language === "en") return "https://alicantissima.es/en/book-now/";
  if (language === "es") return "https://alicantissima.es/book-now/";
  if (language === "pt") return "https://alicantissima.es/pt/book-now/";
  if (language === "fr") return "https://alicantissima.es/fr/book-now/";
  if (language === "it") return "https://alicantissima.es/it/book-now/";
  if (language === "de") return "https://alicantissima.es/de/book-now/";
  if (language === "pl") return "https://alicantissima.es/pl/book-now/";
  if (language === "no") return "https://alicantissima.es/no/book-now/";

  return "https://alicantissima.es/en/book-now/";
}

function handleBackToWebsite() {
  window.location.href = getWebsiteBackUrl();
}

  if (
    selectedService === "luggage" ||
    selectedService === "shower" ||
    selectedService === "combo"
  ) {
    goToService(selectedService);

    return (
      <main className="mx-auto max-w-md p-6 text-zinc-900 dark:text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 text-zinc-900 dark:text-white">
<button
  type="button"
  onClick={handleBackToWebsite}
  className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
>
  ← Back to website
</button>
      <section className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
          Alicantíssima
        </p>

        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Online Reservations
        </h1>

        <p className="text-lg text-zinc-700 dark:text-zinc-200">
          Book fast. Cancel easy.
        </p>

        <p className="mx-auto max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
          Choose your service, pay securely online and cancel for free up to 24
          hours before your booking.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <button
            key={service.key}
            type="button"
            onClick={() => goToService(service.key)}
            className="rounded-2xl border border-zinc-300 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:border-zinc-700 dark:bg-black"
          >
            <p className="text-lg font-bold text-zinc-900 dark:text-white">
              {service.title}
            </p>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {service.subtitle}
            </p>

            <p className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
              {service.price}
            </p>

            <p className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-semibold uppercase tracking-wide text-white dark:bg-[#AFC3BE] dark:text-black">
              {t.bookNow}
            </p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-300 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-zinc-300">
        <p className="font-semibold text-zinc-900 dark:text-white">
          Free cancellation
        </p>
        <p className="mt-1">
          You can cancel your booking for free up to 24 hours before your
          scheduled date.
        </p>
      </section>
    </main>
  );
}

export default function BookNowPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6">Loading...</main>}>
      <BookNowContent />
    </Suspense>
  );
}