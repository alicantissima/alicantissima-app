


import BookingPass from "@/components/booking-pass";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function BookingByCodePage({ params }: PageProps) {
  const supabase = await createClient();
  const { code } = await params;
  const bookingCode = code.trim();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_code", bookingCode)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="border rounded-2xl p-6 space-y-5 shadow-sm bg-white">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Alicantíssima Booking</h1>
          <p className="text-sm text-gray-600">
            Please show this page at reception if needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="border rounded-xl p-3 space-y-2">
            <div className="text-gray-500">Booking code</div>
            <div className="font-semibold">{booking.booking_code}</div>
            <BookingPass code={booking.booking_code} />
          </div>

          <div className="border rounded-xl p-3">
            <div className="text-gray-500">Status</div>
            <div className="font-semibold capitalize">{booking.status}</div>
          </div>

          <div className="border rounded-xl p-3 sm:col-span-2">
            <div className="text-gray-500">Customer</div>
            <div className="font-semibold">{booking.customer_name}</div>
          </div>

          <div className="border rounded-xl p-3 sm:col-span-2">
            <div className="text-gray-500">Email</div>
            <div className="font-semibold break-all">
              {booking.customer_email}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}