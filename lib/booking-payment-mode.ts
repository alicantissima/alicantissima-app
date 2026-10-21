import { createAdminClient } from "@/lib/supabase/admin";

export type BookingPaymentMode = "online" | "on_arrival";

export type BookingPaymentModeState = {
  mode: BookingPaymentMode;
  source: "database" | "environment";
  databaseReady: boolean;
  updatedAt: string | null;
};

export function getEnvironmentPaymentMode(): BookingPaymentMode {
  return process.env.BOOKING_PAYMENT_MODE === "on_arrival"
    ? "on_arrival"
    : "online";
}

// Always read fresh: a payment incident must be switchable without a redeploy.
// Until the migration is applied, preserve the current Vercel emergency setting.
// An unavailable database also falls back to that setting (currently SOS).
export async function getBookingPaymentModeState(): Promise<BookingPaymentModeState> {
  const fallback = {
    mode: getEnvironmentPaymentMode(),
    source: "environment" as const,
    databaseReady: false,
    updatedAt: null,
  };

  try {
    const { data, error } = await createAdminClient()
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "booking_payment_mode")
      .maybeSingle();

    if (error) {
      console.error("Payment mode configuration read error:", error.message);
      return fallback;
    }

    if (data?.value !== "online" && data?.value !== "on_arrival") {
      console.error("Payment mode configuration is missing or invalid.");
      return fallback;
    }

    return {
      mode: data.value as BookingPaymentMode,
      source: "database",
      databaseReady: true,
      updatedAt: data.updated_at ?? null,
    };
  } catch (error) {
    console.error("Payment mode configuration unavailable:", error);
    return fallback;
  }
}

export async function getBookingPaymentMode(): Promise<BookingPaymentMode> {
  return (await getBookingPaymentModeState()).mode;
}
